
export interface AuditLogListResponse {
  events: Array<{
    id: string;
    action: string;
    tenantId: string | null;
    actorUserId: string | null;
    targetType: string;
    targetId: string;
    metadata: any;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { OutboxService, OutboxMetricsDto } from "../listings/outbox.service";
import { AdminTenantSummaryDto } from "./dto/admin-tenant-summary.dto";
import { UpdateTenantStatusDto } from "./dto/update-tenant-status.dto";
import { AdminUserFilterDto, AdminUpdateUserDto } from "./dto/admin-user.dto";
import { AdminCreateDealerDto, AdminInviteDealerStaffDto } from "./dto/admin-dealer.dto";
import {
  ListingStatus,
  MembershipRole,
  TenantStatus,
  UserStatus,
  VerificationStatus,
} from "@automotive-os/database";

export interface AdminTenantCountsResponse {
  total: number;
  byStatus: Record<string, number>;
  byVerificationStatus: Record<string, number>;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  // List reads are not audited (AD-10): they flooded the ledger on every page
  // load. Single-record reads and all mutations remain audited.
  async listAllTenants(
    _adminUserId: string,
    _correlationId?: string,
  ): Promise<AdminTenantSummaryDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      // SEC-17: bounded result set until the dealer directory is paginated.
      take: 500,
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

  /**
   * AD-09: exact dealership counts by operational and KYB status, computed
   * with COUNT/GROUP BY so the overview is not derived from the 500-row list.
   * Aggregate counts only (no per-tenant data), so no audit row is written.
   */
  async getTenantCounts(): Promise<AdminTenantCountsResponse> {
    const [total, statusGroups, verificationGroups] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.prisma.dealerVerification.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const s of Object.values(TenantStatus)) byStatus[s] = 0;
    for (const g of statusGroups as Array<{ status: string; _count: { _all: number } }>) {
      byStatus[g.status] = g._count._all;
    }

    const byVerificationStatus: Record<string, number> = {};
    for (const s of Object.values(VerificationStatus)) byVerificationStatus[s] = 0;
    let withVerificationRow = 0;
    for (const g of verificationGroups as Array<{ status: string; _count: { _all: number } }>) {
      byVerificationStatus[g.status] = g._count._all;
      withVerificationRow += g._count._all;
    }
    // Tenants without a verification row are reported as NOT_SUBMITTED, the
    // same convention used by listAllTenants/getTenantById.
    byVerificationStatus[VerificationStatus.NOT_SUBMITTED] +=
      Math.max(0, total - withVerificationRow);

    return { total, byStatus, byVerificationStatus };
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

    // AD-04: server-side tenant lifecycle rules. The console only offers
    // valid transitions, but the API is the authority.
    this.assertTenantStatusTransition(
      previousStatus,
      newStatus,
      existing.verification?.status ?? VerificationStatus.NOT_SUBMITTED,
    );

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
      }

      await tx.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: "tenant",
          aggregateId: tenantId,
          eventType: "tenant.status_updated",
          payload: {
            tenantId,
            previousStatus,
            newStatus,
            reason: dto.reason || "Platform administration update",
            updatedByUserId: adminUserId,
          },
        },
      });

      return t;
    });

    await this.auditService.logAction({
      tenantId,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_UPDATE_TENANT_STATUS",
      targetType: "tenant",
      targetId: tenantId,
      correlationId: correlationId || null,
      metadata: {
        previousStatus,
        newStatus,
        reason: dto.reason || null,
      },
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
   * Allowed tenant status transitions:
   *  - CLOSED is terminal.
   *  - No transition back to PENDING.
   *  - PENDING -> ACTIVE requires an APPROVED KYB verification.
   *  - SUSPENDED -> ACTIVE is a reactivation.
   *  - ACTIVE/PENDING/SUSPENDED -> SUSPENDED/CLOSED as enforcement actions.
   */
  private assertTenantStatusTransition(
    from: TenantStatus,
    to: TenantStatus,
    verificationStatus: VerificationStatus | string,
  ): void {
    if (from === to) {
      throw new ConflictException(
        `TENANT_STATUS_UNCHANGED: Dealership is already ${from}.`,
      );
    }
    if (from === TenantStatus.CLOSED) {
      throw new ConflictException(
        "TENANT_CLOSED_TERMINAL: A closed dealership cannot change status.",
      );
    }
    if (to === TenantStatus.PENDING) {
      throw new ConflictException(
        `TENANT_STATUS_TRANSITION_INVALID: A dealership cannot be moved from ${from} back to PENDING.`,
      );
    }
    if (
      to === TenantStatus.ACTIVE &&
      from === TenantStatus.PENDING &&
      verificationStatus !== VerificationStatus.APPROVED
    ) {
      throw new ConflictException(
        `TENANT_KYB_NOT_APPROVED: A pending dealership can only be activated after KYB verification is APPROVED (current: ${verificationStatus}).`,
      );
    }
  }

  // ==========================================
  // Platform User Administration
  // ==========================================

  async listUsers(filter: AdminUserFilterDto, _adminUserId: string) {
    // AD-10: a paged/searched list read is not audited (one row per debounced
    // search keystroke inflated the ledger). Sensitive single-record reads
    // (getUserById, getTenantById) and all mutations remain audited.

    const where: any = {};

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
        { phoneE164: { contains: q } },
      ];
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.role) {
      if (filter.role === "PLATFORM_ADMIN") {
        where.isPlatformAdmin = true;
      } else if (filter.role === "BUYER") {
        where.buyer = { isNot: null };
      } else {
        where.memberships = {
          some: {
            role: filter.role as MembershipRole,
            active: true,
          },
        };
      }
    }

    if (filter.tenantId) {
      where.memberships = {
        some: {
          tenantId: filter.tenantId,
        },
      };
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: true,
          memberships: {
            include: {
              tenant: {
                select: {
                  id: true,
                  displayName: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        phoneE164: u.phoneE164,
        isPlatformAdmin: u.isPlatformAdmin,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
        memberships: u.memberships.map((m) => ({
          tenantId: m.tenantId,
          tenantName: m.tenant.displayName,
          tenantSlug: m.tenant.slug,
          role: m.role,
          active: m.active,
        })),
        isBuyer: !!u.buyer,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string, adminUserId: string) {
    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_GET_USER",
      targetType: "user",
      targetId: userId,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyer: true,
        memberships: {
          include: {
            tenant: true,
          },
        },
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      id: user.id,
      identitySubject: user.identitySubject,
      email: user.email,
      phoneE164: user.phoneE164,
      displayName: user.displayName,
      isPlatformAdmin: user.isPlatformAdmin,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
      mfaEnabled: user.mfaEnabled,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      memberships: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        tenantName: m.tenant.displayName,
        tenantSlug: m.tenant.slug,
        tenantStatus: m.tenant.status,
        role: m.role,
        active: m.active,
      })),
      buyer: user.buyer,
      activeSessionCount: user.sessions.length,
      recentSessions: user.sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    };
  }

  async updateUser(userId: string, dto: AdminUpdateUserDto, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Protection: Prevent demoting or disabling the last active platform admin
    if (
      user.isPlatformAdmin &&
      (dto.isPlatformAdmin === false ||
        dto.status === "DISABLED" ||
        dto.status === "SUSPENDED")
    ) {
      const activeAdminCount = await this.prisma.user.count({
        where: {
          isPlatformAdmin: true,
          status: "ACTIVE",
          id: { not: userId },
        },
      });

      if (activeAdminCount === 0) {
        throw new BadRequestException(
          "CANNOT_DISABLE_LAST_PLATFORM_ADMIN: Automotive OS requires at least one active platform administrator."
        );
      }
    }

    // AD-02: an administrator may not suspend, disable or demote their own
    // account. Checked after the last-admin rule so that error stays primary.
    if (
      userId === adminUserId &&
      (dto.status === "DISABLED" ||
        dto.status === "SUSPENDED" ||
        dto.isPlatformAdmin === false)
    ) {
      throw new BadRequestException(
        "CANNOT_MODIFY_OWN_ACCOUNT: You cannot suspend, disable or demote your own administrator account.",
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName ? { displayName: dto.displayName.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(typeof dto.isPlatformAdmin === "boolean"
          ? { isPlatformAdmin: dto.isPlatformAdmin }
          : {}),
      },
    });

    // If disabled or suspended, immediately revoke sessions
    if (dto.status === "DISABLED" || dto.status === "SUSPENDED") {
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_UPDATE_USER",
      targetType: "user",
      targetId: userId,
      metadata: {
        previousStatus: user.status,
        newStatus: updated.status,
        isPlatformAdmin: updated.isPlatformAdmin,
        reason: dto.reason || "Platform administration update",
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      isPlatformAdmin: updated.isPlatformAdmin,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async revokeUserSessions(userId: string, adminUserId: string) {
    if (userId === adminUserId) {
      throw new BadRequestException(
        "CANNOT_REVOKE_OWN_SESSIONS: Use Sign out to end your own session instead of revoking it from the user console.",
      );
    }

    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.logAction({
      tenantId: null,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_REVOKE_SESSIONS",
      targetType: "user",
      targetId: userId,
      metadata: { revokedCount: result.count },
    });

    return { revokedCount: result.count, success: true };
  }

  async deleteUser(userId: string, adminUserId: string) {
    // Soft-delete pattern: set status to DISABLED and revoke sessions
    return this.updateUser(
      userId,
      { status: "DISABLED", reason: "Soft-deleted by platform administrator" },
      adminUserId
    );
  }

  // ==========================================
  // Dealership Provisioning & Management
  // ==========================================

  async createDealer(dto: AdminCreateDealerDto, adminUserId: string) {
    const normalizedSlug = dto.slug.toLowerCase().trim();
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: normalizedSlug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Dealership with slug '${normalizedSlug}' already exists.`
      );
    }

    const normalizedAdminEmail = dto.adminEmail.toLowerCase().trim();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          slug: normalizedSlug,
          legalName: dto.legalName.trim(),
          displayName: dto.displayName.trim(),
          currency: dto.currency || "AED",
          status: "ACTIVE",
          verification: {
            create: {
              status: "APPROVED",
              reviewedByUserId: adminUserId,
              reviewedAt: new Date(),
              reviewNotes: "Directly provisioned via Platform Administration Console",
            },
          },
          branches: {
            create: {
              name: `${dto.displayName} — Flagship Branch`,
              emirate: "Dubai",
              city: "Dubai",
            },
          },
        },
      });

      // 2. Resolve or provision dealer principal user
      let dealerUser = await tx.user.findFirst({
        where: { email: { equals: normalizedAdminEmail, mode: "insensitive" } },
      });

      if (!dealerUser) {
        dealerUser = await tx.user.create({
          data: {
            identitySubject: `email_${normalizedAdminEmail}`,
            email: normalizedAdminEmail,
            displayName: dto.adminName.trim(),
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        });
      }

      // 3. Create active OWNER membership
      await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId: dealerUser.id,
          role: MembershipRole.OWNER,
          active: true,
        },
      });

      // 4. Outbox event
      await tx.outboxEvent.create({
        data: {
          tenantId: tenant.id,
          aggregateType: "tenant",
          aggregateId: tenant.id,
          eventType: "tenant.created",
          payload: {
            tenantId: tenant.id,
            slug: tenant.slug,
            displayName: tenant.displayName,
            adminUserId: dealerUser.id,
            adminEmail: normalizedAdminEmail,
          },
        },
      });

      return { tenant, dealerUser };
    });

    await this.auditService.logAction({
      tenantId: result.tenant.id,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_CREATE_DEALER",
      targetType: "tenant",
      targetId: result.tenant.id,
      metadata: {
        slug: result.tenant.slug,
        displayName: result.tenant.displayName,
        adminEmail: normalizedAdminEmail,
      },
    });

    return {
      id: result.tenant.id,
      slug: result.tenant.slug,
      legalName: result.tenant.legalName,
      displayName: result.tenant.displayName,
      status: result.tenant.status,
      adminEmail: normalizedAdminEmail,
      createdAt: result.tenant.createdAt.toISOString(),
    };
  }

  async inviteDealerStaff(
    tenantId: string,
    dto: AdminInviteDealerStaffDto,
    adminUserId: string
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour expiration

    const invitation = await this.prisma.userInvitation.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        tenantId,
        role: dto.role,
        isPlatformAdmin: false,
        invitedById: adminUserId,
        expiresAt,
      },
    });

    await this.auditService.logAction({
      tenantId,
      actorUserId: adminUserId,
      action: "PLATFORM_ADMIN_INVITE_DEALER_STAFF",
      targetType: "invitation",
      targetId: invitation.id,
      metadata: {
        email: normalizedEmail,
        role: dto.role,
        tenantId,
      },
    });

    return {
      success: true,
      invitationId: invitation.id,
      email: normalizedEmail,
      role: dto.role,
      expiresAt: expiresAt.toISOString(),
      activationToken: rawToken,
    };
  }

  // ==========================================
  // Platform Audit Trail Stream
  // ==========================================

  async listAuditLogs(
    query: { limit?: number; offset?: number; targetType?: string },
    adminUserId: string
  ): Promise<AuditLogListResponse> {
    const limit = Math.max(1, Math.min(100, query.limit || 50));
    const offset = Math.max(0, query.offset || 0);

    const where: any = {};
    if (query.targetType) {
      where.targetType = query.targetType;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return {
      events: events.map((e) => ({
        id: e.id,
        action: e.action,
        tenantId: e.tenantId,
        actorUserId: e.actorUserId,
        targetType: e.targetType,
        targetId: e.targetId,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    };
  }

  // ==========================================
  // Outbox Processing & Worker Hooks
  // ==========================================

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
      targetId: "QUEUE",
      correlationId: correlationId || null,
      metadata: { limit, reason: "manual_admin_trigger" },
    });

    const processedCount = await this.outboxService.processPendingEvents(limit);
    const metrics = await this.outboxService.getMetrics();

    return {
      processedCount,
      metrics,
    };
  }

  async getOutboxMetrics(adminUserId: string): Promise<OutboxMetricsDto> {
    return this.outboxService.getMetrics();
  }

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
