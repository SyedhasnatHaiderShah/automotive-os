import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { OutboxService, OutboxMetricsDto } from "../listings/outbox.service";
import { AdminTenantSummaryDto } from "./dto/admin-tenant-summary.dto";
import { UpdateTenantStatusDto } from "./dto/update-tenant-status.dto";
import { ListingStatus, TenantStatus } from "@automotive-os/database";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async listAllTenants(
    adminUserId: string,
    correlationId?: string,
  ): Promise<AdminTenantSummaryDto[]> {
    // Audit hook: every platform administration inspection is recorded
    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_LIST_ALL_TENANTS",
      targetType: "tenants",
      targetId: "ALL",
      correlationId: correlationId || null,
      metadata: { reason: "cross_tenant_platform_inspection" },
    });

    const tenants = await this.prisma.tenant.findMany({
      include: {
        verification: true,
        _count: {
          select: {
            memberships: { where: { active: true } },
            vehicles: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      legalName: t.legalName,
      displayName: t.displayName,
      status: t.status,
      verificationStatus: t.verification
        ? t.verification.status
        : "NOT_SUBMITTED",
      staffCount: t._count.memberships,
      vehicleCount: t._count.vehicles,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getTenantById(
    adminUserId: string,
    tenantId: string,
    correlationId?: string,
  ): Promise<any> {
    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_GET_TENANT",
      targetType: "tenant",
      targetId: tenantId,
      correlationId: correlationId || null,
      metadata: { reason: "cross_tenant_dossier_inspection" },
    });

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tenantId,
      );
    const tenant = await this.prisma.tenant.findFirst({
      where: isUuid
        ? { OR: [{ id: tenantId }, { slug: tenantId }] }
        : { slug: tenantId },
      include: {
        verification: true,
        branches: true,
        memberships: {
          where: { active: true },
          include: { user: true },
        },
        _count: {
          select: {
            vehicles: true,
            listings: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      legalName: tenant.legalName,
      displayName: tenant.displayName,
      status: tenant.status,
      verificationStatus: tenant.verification
        ? tenant.verification.status
        : "NOT_SUBMITTED",
      tradeLicenseNumber: tenant.verification?.tradeLicenseRef || null,
      tradeLicenseExpiry: tenant.verification?.licenseExpiry
        ? tenant.verification.licenseExpiry.toISOString()
        : null,
      branches: tenant.branches,
      vehicleCount: tenant._count.vehicles,
      listingCount: tenant._count.listings,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }

  /**
   * Update dealership operational status (e.g. SUSPENDED, ACTIVE).
   * When suspended, atomicity guarantees that active published listings unpublish
   * and transactional outbox events are appended.
   */
  async updateTenantStatus(
    adminUserId: string,
    tenantId: string,
    dto: UpdateTenantStatusDto,
    correlationId?: string,
  ): Promise<AdminTenantSummaryDto> {
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { verification: true },
    });

    if (!existing) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const previousStatus = existing.status;
    const newStatus = dto.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.update({
        where: { id: tenantId },
        data: { status: newStatus },
        include: {
          verification: true,
          _count: {
            select: {
              memberships: { where: { active: true } },
              vehicles: true,
            },
          },
        },
      });

      // If tenant is suspended or closed, unpublish all active listings
      if (
        newStatus === TenantStatus.SUSPENDED ||
        newStatus === TenantStatus.CLOSED
      ) {
        const publishedListings = await tx.listing.findMany({
          where: {
            tenantId,
            status: ListingStatus.PUBLISHED,
          },
        });

        if (publishedListings.length > 0) {
          await tx.listing.updateMany({
            where: {
              tenantId,
              status: ListingStatus.PUBLISHED,
            },
            data: {
              status: ListingStatus.PAUSED,
            },
          });

          // Outbox event for each unpublishing listing
          for (const listing of publishedListings) {
            await tx.outboxEvent.create({
              data: {
                tenantId,
                aggregateType: "listing",
                aggregateId: listing.id,
                eventType: "listing.unpublished",
                payload: {
                  listingId: listing.id,
                  vehicleId: listing.vehicleId,
                  reason: `Tenant suspended by platform admin: ${dto.reason || "Regulatory action"}`,
                  previousStatus: ListingStatus.PUBLISHED,
                  newStatus: ListingStatus.PAUSED,
                },
              },
            });
          }
        }

        // Outbox event for tenant suspension
        await tx.outboxEvent.create({
          data: {
            tenantId,
            aggregateType: "tenant",
            aggregateId: tenantId,
            eventType: "tenant.suspended",
            payload: {
              tenantId,
              previousStatus,
              newStatus,
              reason: dto.reason,
            },
          },
        });
      }

      // Audit log entry in the same transaction
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorUserId: adminUserId,
          action:
            newStatus === TenantStatus.SUSPENDED
              ? "TENANT_SUSPENDED"
              : "TENANT_STATUS_UPDATED",
          targetType: "tenant",
          targetId: tenantId,
          correlationId: correlationId || null,
          metadata: {
            previousStatus,
            newStatus,
            reason: dto.reason,
          },
        },
      });

      return t;
    });

    return {
      id: updated.id,
      slug: updated.slug,
      legalName: updated.legalName,
      displayName: updated.displayName,
      status: updated.status,
      verificationStatus: updated.verification
        ? updated.verification.status
        : "NOT_SUBMITTED",
      staffCount: updated._count.memberships,
      vehicleCount: updated._count.vehicles,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Process pending Outbox events on demand (Audited Platform Admin action).
   */
  async processOutbox(
    adminUserId: string,
    limit = 50,
    correlationId?: string,
  ): Promise<{ processedCount: number; metrics: OutboxMetricsDto }> {
    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_PROCESS_OUTBOX",
      targetType: "outbox",
      targetId: "ALL",
      correlationId: correlationId || null,
      metadata: { limit },
    });

    const processedCount = await this.outboxService.processPendingEvents(limit);
    const metrics = await this.outboxService.getMetrics();

    return {
      processedCount,
      metrics,
    };
  }

  /**
   * Get Outbox metrics and health statistics.
   */
  async getOutboxMetrics(adminUserId: string): Promise<OutboxMetricsDto> {
    return this.outboxService.getMetrics();
  }

  /**
   * Retry failed outbox events.
   */
  async retryFailedOutboxEvents(
    adminUserId: string,
  ): Promise<{ retriedCount: number }> {
    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_RETRY_OUTBOX",
      targetType: "outbox",
      targetId: "FAILED",
      metadata: { reason: "manual_admin_retry" },
    });

    const retriedCount = await this.outboxService.retryFailedEvents();
    return { retriedCount };
  }
}
