import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EnquiryRateLimiterService } from './enquiry-rate-limiter.service';
import {
  CreateLeadEnquiryDto,
  LeadEnquiryCreatedResponseDto,
} from './dto/create-lead-enquiry.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import {
  DealerBuyerContactDto,
  DealerLeadDetailDto,
  DealerLeadSummaryDto,
} from './dto/dealer-lead.dto';
import {
  LeadStatus,
  ListingStatus,
  StockStatus,
  TenantStatus,
} from '@automotive-os/database';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly rateLimiter: EnquiryRateLimiterService
  ) {}

  /**
   * Buyer submits inquiry for a published vehicle listing with explicit field-level data grant.
   * Rate limits spam and atomically creates Lead, LeadDataGrant, OutboxEvent, and AuditEvent.
   */
  async createLeadEnquiry(
    buyerUserId: string,
    listingId: string,
    dto: CreateLeadEnquiryDto
  ): Promise<LeadEnquiryCreatedResponseDto> {
    // 1. Rate Limiting Check
    this.rateLimiter.checkLimit(buyerUserId);

    // 2. Validate listing and active stock
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId);
    const listing = await this.prisma.listing.findFirst({
      where: isUuid
        ? { OR: [{ id: listingId }, { slug: listingId }] }
        : { slug: listingId },
      include: {
        vehicle: true,
        tenant: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    if (listing.status !== ListingStatus.PUBLISHED) {
      throw new BadRequestException('Listing is not currently published for inquiries');
    }

    if (listing.vehicle.stockStatus !== StockStatus.AVAILABLE) {
      throw new BadRequestException('Vehicle is no longer available in dealership stock');
    }

    if (listing.tenant.status !== TenantStatus.ACTIVE) {
      throw new BadRequestException('Dealership is currently inactive');
    }

    // 3. Atomically create Lead, Grant, Outbox, and Audit
    const lead = await this.prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          tenantId: listing.tenantId,
          listingId: listing.id,
          buyerUserId,
          intent: dto.intent,
          preferredContact: dto.preferredContact,
          buyerMessage: dto.message || null,
          status: LeadStatus.NEW,
        },
      });

      // Explicit Data Grant record
      await tx.leadDataGrant.create({
        data: {
          tenantId: listing.tenantId,
          leadId: createdLead.id,
          fieldsGranted: dto.fieldsToShare,
          purpose: 'VEHICLE_PURCHASE_ENQUIRY',
          consentTextVer: dto.consentTextVersion,
        },
      });

      // Outbox Event
      await tx.outboxEvent.create({
        data: {
          tenantId: listing.tenantId,
          aggregateType: 'lead',
          aggregateId: createdLead.id,
          eventType: 'lead.created',
          payload: {
            leadId: createdLead.id,
            tenantId: listing.tenantId,
            listingId: listing.id,
            buyerUserId,
            intent: createdLead.intent,
            fieldsGranted: dto.fieldsToShare,
          },
        },
      });

      // Audit Event
      await tx.auditEvent.create({
        data: {
          tenantId: listing.tenantId,
          actorUserId: buyerUserId,
          action: 'LEAD_ENQUIRY_CREATED',
          targetType: 'lead',
          targetId: createdLead.id,
          metadata: {
            listingId: listing.id,
            intent: createdLead.intent,
            fieldsGranted: dto.fieldsToShare,
          },
        },
      });

      return createdLead;
    });

    return {
      id: lead.id,
      status: lead.status,
      listingId: lead.listingId,
      tenantId: lead.tenantId,
      createdAt: lead.createdAt.toISOString(),
    };
  }

  /**
   * Dealership CRM staff lists leads for their tenant.
   * Privacy-preserving summary projection.
   */
  async listTenantLeads(
    tenantId: string,
    filters?: { status?: LeadStatus; page?: number; limit?: number }
  ): Promise<{ items: DealerLeadSummaryDto[]; total: number }> {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(50, Math.max(1, filters?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      status: filters?.status,
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          listing: true,
          buyer: true,
          grant: true,
          tenant: {
            include: {
              memberships: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    const items: DealerLeadSummaryDto[] = leads.map((lead) => {
      let buyerDisplayName = 'Prospective Buyer';
      const isGranted =
        lead.grant &&
        !lead.grant.revokedAt &&
        lead.grant.fieldsGranted.includes('name');

      if (isGranted) {
        buyerDisplayName = lead.buyer.displayName;
      }

      let assignedStaffName: string | null = null;
      if (lead.assignedMembershipId) {
        const staff = lead.tenant.memberships.find(
          (m) => m.id === lead.assignedMembershipId
        );
        if (staff) {
          assignedStaffName = staff.user.displayName;
        }
      }

      return {
        id: lead.id,
        listingId: lead.listing.id,
        listingTitle: lead.listing.title,
        intent: lead.intent,
        status: lead.status,
        preferredContact: lead.preferredContact,
        buyerDisplayName,
        assignedMembershipId: lead.assignedMembershipId,
        assignedStaffName,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      };
    });

    return { items, total };
  }

  /**
   * Dealership CRM staff views full lead detail.
   * Strictly enforces field-level authorization and grant revocation!
   */
  async getTenantLeadById(
    tenantId: string,
    leadId: string
  ): Promise<DealerLeadDetailDto> {
    const lead = await this.prisma.lead.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: leadId,
        },
      },
      include: {
        listing: true,
        buyer: true,
        grant: true,
        appointments: {
          orderBy: { startsAt: 'asc' },
        },
        tenant: {
          include: {
            memberships: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found in this dealership`);
    }

    return this.mapDealerLeadDetail(lead);
  }

  /**
   * Update lead lifecycle status.
   */
  async updateLeadStatus(
    tenantId: string,
    leadId: string,
    dto: UpdateLeadStatusDto,
    actorUserId?: string
  ): Promise<DealerLeadDetailDto> {
    const existing = await this.prisma.lead.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: leadId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Lead ${leadId} not found in this dealership`);
    }

    const previousStatus = existing.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lead.update({
        where: {
          tenantId_id: {
            tenantId,
            id: leadId,
          },
        },
        data: {
          status: dto.status,
        },
        include: {
          listing: true,
          buyer: true,
          grant: true,
          appointments: {
            orderBy: { startsAt: 'asc' },
          },
          tenant: {
            include: {
              memberships: {
                include: { user: true },
              },
            },
          },
        },
      });

      // Outbox Event
      await tx.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: 'lead',
          aggregateId: leadId,
          eventType: 'lead.status_updated',
          payload: {
            leadId,
            tenantId,
            previousStatus,
            newStatus: dto.status,
          },
        },
      });

      // Audit Event
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorUserId: actorUserId || null,
          action: 'LEAD_STATUS_UPDATED',
          targetType: 'lead',
          targetId: leadId,
          metadata: {
            previousStatus,
            newStatus: dto.status,
          },
        },
      });

      return result;
    });

    return this.mapDealerLeadDetail(updated);
  }

  /**
   * Assign lead to active staff membership.
   */
  async assignLead(
    tenantId: string,
    leadId: string,
    dto: AssignLeadDto,
    actorUserId?: string
  ): Promise<DealerLeadDetailDto> {
    const existing = await this.prisma.lead.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: leadId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Lead ${leadId} not found in this dealership`);
    }

    if (dto.assignedMembershipId) {
      const membership = await this.prisma.membership.findUnique({
        where: { id: dto.assignedMembershipId },
      });

      if (!membership || membership.tenantId !== tenantId || !membership.active) {
        throw new BadRequestException(
          'Target staff membership does not belong to this dealership or is inactive'
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lead.update({
        where: {
          tenantId_id: {
            tenantId,
            id: leadId,
          },
        },
        data: {
          assignedMembershipId: dto.assignedMembershipId || null,
        },
        include: {
          listing: true,
          buyer: true,
          grant: true,
          appointments: {
            orderBy: { startsAt: 'asc' },
          },
          tenant: {
            include: {
              memberships: {
                include: { user: true },
              },
            },
          },
        },
      });

      // Outbox Event
      await tx.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: 'lead',
          aggregateId: leadId,
          eventType: 'lead.assigned',
          payload: {
            leadId,
            tenantId,
            assignedMembershipId: dto.assignedMembershipId || null,
          },
        },
      });

      // Audit Event
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorUserId: actorUserId || null,
          action: 'LEAD_ASSIGNED',
          targetType: 'lead',
          targetId: leadId,
          metadata: {
            assignedMembershipId: dto.assignedMembershipId || null,
          },
        },
      });

      return result;
    });

    return this.mapDealerLeadDetail(updated);
  }

  /**
   * Field-Level Data Grant Enforcement Helper.
   * If grant is revoked or nonexistent: ZERO contact details returned.
   * If active: returns ONLY fields explicitly granted in `fieldsGranted`.
   */
  private mapDealerLeadDetail(lead: any): DealerLeadDetailDto {
    const grant = lead.grant;
    let buyerContact: DealerBuyerContactDto;

    if (!grant) {
      buyerContact = {
        name: null,
        phone: null,
        email: null,
        grantStatus: 'NO_GRANT',
      };
    } else if (grant.revokedAt !== null) {
      buyerContact = {
        name: null,
        phone: null,
        email: null,
        grantStatus: 'REVOKED',
      };
    } else {
      const fields = grant.fieldsGranted || [];
      buyerContact = {
        name: fields.includes('name') ? lead.buyer.displayName : null,
        phone: fields.includes('phone') ? lead.buyer.phoneE164 : null,
        email: fields.includes('email') ? lead.buyer.email : null,
        grantStatus: 'ACTIVE',
      };
    }

    let assignedStaffName: string | null = null;
    if (lead.assignedMembershipId && lead.tenant?.memberships) {
      const staff = lead.tenant.memberships.find(
        (m: any) => m.id === lead.assignedMembershipId
      );
      if (staff) {
        assignedStaffName = staff.user.displayName;
      }
    }

    return {
      id: lead.id,
      tenantId: lead.tenantId,
      listing: {
        id: lead.listing.id,
        slug: lead.listing.slug,
        title: lead.listing.title,
        askingPriceFils: lead.listing.askingPriceFils.toString(),
      },
      intent: lead.intent,
      status: lead.status,
      preferredContact: lead.preferredContact,
      buyerMessage: lead.buyerMessage,
      assignedMembershipId: lead.assignedMembershipId,
      assignedStaffName,
      buyerContact,
      appointments: (lead.appointments || []).map((a: any) => ({
        id: a.id,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        status: a.status,
        note: a.note,
      })),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }
}
