import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertLeadTransition } from './lead-transitions';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
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
  VerificationStatus,
} from '@automotive-os/database';

interface LeadPeople {
  buyers: Map<string, { id: string; displayName: string; phoneE164: string | null; email: string | null }>;
  staff: Map<string, string>;
}

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
    // Vehicles and tenants are not visible to a buyer context; read the
    // listing for validation under a read-only elevated context.
    const listing = await runWithDbContext({ isAdmin: true }, () =>
      this.prisma.listing.findFirst({
        where: isUuid
          ? { OR: [{ id: listingId }, { slug: listingId }] }
          : { slug: listingId },
        include: {
          vehicle: true,
          tenant: { include: { verification: true } },
        },
      })
    );

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    if (listing.tenant.verification?.status !== VerificationStatus.APPROVED) {
      throw new BadRequestException('Dealership is not verified for marketplace enquiries');
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
    const lead = await runWithDbContext({ tenantId: listing.tenantId, userId: buyerUserId }, () =>
      this.prisma.$transaction(async (tx) => {
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
    })
    );

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
          grant: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    const people = await this.loadLeadPeople(leads);

    const items: DealerLeadSummaryDto[] = leads.map((lead) => {
      let buyerDisplayName = 'Prospective Buyer';
      const isGranted =
        lead.grant &&
        !lead.grant.revokedAt &&
        lead.grant.fieldsGranted.includes('name');

      if (isGranted) {
        buyerDisplayName = people.buyers.get(lead.buyerUserId)?.displayName ?? buyerDisplayName;
      }

      const assignedStaffName: string | null = lead.assignedMembershipId
        ? people.staff.get(lead.assignedMembershipId) ?? null
        : null;

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
        grant: true,
        appointments: {
          orderBy: { startsAt: 'asc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found in this dealership`);
    }

    return this.mapDealerLeadDetail(lead, await this.loadLeadPeople([lead]));
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
    assertLeadTransition(previousStatus, dto.status);

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
          grant: true,
          appointments: {
            orderBy: { startsAt: 'asc' },
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

    return this.mapDealerLeadDetail(updated, await this.loadLeadPeople([updated]));
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
          grant: true,
          appointments: {
            orderBy: { startsAt: 'asc' },
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

    return this.mapDealerLeadDetail(updated, await this.loadLeadPeople([updated]));
  }

  /**
   * Field-Level Data Grant Enforcement Helper.
   * If grant is revoked or nonexistent: ZERO contact details returned.
   * If active: returns ONLY fields explicitly granted in `fieldsGranted`.
   */
  /**
   * Buyer identities and colleague names are hidden from a dealer session by
   * RLS (`users_self_isolation`), so including `buyer`/`memberships.user` in a
   * lead query failed for every tenant that has leads (QA-LOCAL-02). Only the
   * referenced ids are resolved, under a read-only elevated context; the grant
   * filter below remains the authority for what a dealer may see.
   */
  private async loadLeadPeople(
    leads: Array<{ buyerUserId: string; assignedMembershipId: string | null }>,
  ): Promise<LeadPeople> {
    const buyerIds = [...new Set(leads.map((l) => l.buyerUserId))];
    const membershipIds = [
      ...new Set(leads.map((l) => l.assignedMembershipId).filter((v): v is string => Boolean(v))),
    ];
    const [buyers, staff] = await runWithDbContext({ isAdmin: true }, async () =>
      Promise.all([
        buyerIds.length
          ? this.prisma.user.findMany({
              where: { id: { in: buyerIds } },
              select: { id: true, displayName: true, phoneE164: true, email: true },
            })
          : Promise.resolve([]),
        membershipIds.length
          ? this.prisma.membership.findMany({
              where: { id: { in: membershipIds } },
              select: { id: true, user: { select: { displayName: true } } },
            })
          : Promise.resolve([]),
      ]),
    );
    return {
      buyers: new Map(buyers.map((b) => [b.id, b])),
      staff: new Map(staff.map((m) => [m.id, m.user.displayName])),
    };
  }

  private mapDealerLeadDetail(lead: any, people: LeadPeople): DealerLeadDetailDto {
    const grant = lead.grant;
    const buyer = people.buyers.get(lead.buyerUserId);
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
        name: fields.includes('name') ? buyer?.displayName ?? null : null,
        phone: fields.includes('phone') ? buyer?.phoneE164 ?? null : null,
        email: fields.includes('email') ? buyer?.email ?? null : null,
        grantStatus: 'ACTIVE',
      };
    }

    const assignedStaffName: string | null = lead.assignedMembershipId
      ? people.staff.get(lead.assignedMembershipId) ?? null
      : null;

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
