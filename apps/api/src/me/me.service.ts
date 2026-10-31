import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import { buildPublicMediaUrl } from '../common/media-url.util';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/auth.service';
import { MeResponseDto, BuyerProfileResponseDto } from './dto/me-response.dto';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';
import {
  UpdateAccountSettingsDto,
  AccountSettingsResponseDto,
} from './dto/update-account-settings.dto';
import { AddFavoriteDto, FavoriteResponseDto } from './dto/favorite.dto';
import {
  CreateSavedSearchDto,
  SavedSearchResponseDto,
} from './dto/saved-search.dto';
import { BuyerEnquiryResponseDto } from './dto/buyer-enquiry-response.dto';
import {
  AppointmentResponseDto,
  CreateAppointmentDto,
} from './dto/create-appointment.dto';
import { AppointmentStatus, ListingStatus } from '@automotive-os/database';

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Consent grants for the buyer's own leads (ids come from a buyer-scoped
   * query). Grants are tenant rows, so they are read by lead id under a
   * read-only elevated context.
   */
  private async loadLeadGrants(leadIds: string[]) {
    const ids = [...new Set(leadIds)].filter(Boolean);
    if (ids.length === 0) return new Map<string, LeadGrantRow>();
    const rows = await runWithDbContext({ isAdmin: true }, () =>
      this.prisma.leadDataGrant.findMany({
        where: { leadId: { in: ids } },
        select: {
          id: true,
          leadId: true,
          fieldsGranted: true,
          purpose: true,
          consentTextVer: true,
          grantedAt: true,
          revokedAt: true,
        },
      })
    );
    return new Map<string, LeadGrantRow>(rows.map((g) => [g.leadId, g]));
  }

  /**
   * Public listing cards for listings the buyer is linked to (favourites,
   * enquiries, appointments). Vehicles, media and non-published listings are
   * tenant rows that RLS hides from a buyer context, so they are read under a
   * read-only elevated context, filtered to the given ids, and projected to
   * public fields only (no cost, full VIN, notes or private media).
   */
  private async loadListingCards(listingIds: string[]): Promise<Map<string, ListingCard>> {
    const ids = [...new Set(listingIds)].filter(Boolean);
    if (ids.length === 0) return new Map();
    const listings = await runWithDbContext({ isAdmin: true }, () =>
      this.prisma.listing.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          slug: true,
          title: true,
          askingPriceFils: true,
          status: true,
          tenant: { select: { displayName: true } },
          vehicle: {
            select: {
              vin: true,
              media: {
                where: { isPublic: true, kind: { in: ['EXTERIOR', 'INTERIOR'] } },
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { objectKey: true },
              },
            },
          },
        },
      })
    );
    return new Map(
      listings.map((l) => [
        l.id,
        {
          id: l.id,
          slug: l.slug,
          title: l.title,
          askingPriceFils: l.askingPriceFils.toString(),
          status: l.status,
          dealershipName: l.tenant?.displayName ?? null,
          vinMasked: l.vehicle?.vin ? `${l.vehicle.vin.slice(0, 3)}•••••${l.vehicle.vin.slice(-4)}` : null,
          thumbnailUrl: l.vehicle?.media?.[0]?.objectKey
            ? buildPublicMediaUrl(l.vehicle.media[0].objectKey)
            : null,
        },
      ])
    );
  }

  async getMe(user: AuthenticatedUser): Promise<MeResponseDto> {
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId: user.id },
    });

    return {
      id: user.id,
      identitySubject: user.identitySubject,
      email: user.email,
      phoneE164: user.phoneE164,
      displayName: user.displayName,
      isPlatformAdmin: user.isPlatformAdmin,
      buyerProfile: buyerProfile ? this.mapBuyerProfile(buyerProfile) : null,
      memberships: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        tenantSlug: m.tenantSlug,
        tenantName: m.tenantName,
        tenantStatus: m.tenantStatus,
        role: m.role,
        active: m.active,
      })),
    };
  }

  async getBuyerProfile(userId: string): Promise<BuyerProfileResponseDto> {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Buyer profile not found for this user');
    }

    return this.mapBuyerProfile(profile);
  }

  async updateBuyerProfile(
    userId: string,
    dto: UpdateBuyerProfileDto
  ): Promise<BuyerProfileResponseDto> {
    // undefined = leave unchanged; null = clear the stored value (MK-08).
    const toFils = (v: number | null | undefined) =>
      v === undefined ? undefined : v === null ? null : BigInt(v);
    const profile = await this.prisma.buyerProfile.upsert({
      where: { userId },
      update: {
        preferredLanguage: dto.preferredLanguage,
        preferredEmirate: dto.preferredEmirate,
        budgetMinFils: toFils(dto.budgetMinFils),
        budgetMaxFils: toFils(dto.budgetMaxFils),
        preferredMakes: dto.preferredMakes,
      },
      create: {
        userId,
        preferredLanguage: dto.preferredLanguage || 'en',
        preferredEmirate: dto.preferredEmirate ?? null,
        budgetMinFils: toFils(dto.budgetMinFils) ?? null,
        budgetMaxFils: toFils(dto.budgetMaxFils) ?? null,
        preferredMakes: dto.preferredMakes || [],
        // WhatsApp contact is opt-in; never inherit the column default (MK-09).
        whatsappCommsConsent: false,
      },
    });

    return this.mapBuyerProfile(profile);
  }

  // ==========================================
  // Favorites (Buyer-Owned Bookmarks)
  // ==========================================

  async addFavorite(
    userId: string,
    dto: AddFavoriteDto
  ): Promise<FavoriteResponseDto> {
    const listing = (await this.loadListingCards([dto.listingId])).get(dto.listingId);

    if (!listing || listing.status !== ListingStatus.PUBLISHED) {
      throw new NotFoundException(`Listing ${dto.listingId} not found`);
    }

    try {
      const favorite = await this.prisma.favorite.upsert({
        where: {
          userId_listingId: {
            userId,
            listingId: dto.listingId,
          },
        },
        update: {},
        create: {
          userId,
          listingId: dto.listingId,
        },
      });

      return {
        id: favorite.id,
        listingId: listing.id,
        slug: listing.slug,
        title: listing.title,
        askingPriceFils: listing.askingPriceFils,
        status: listing.status,
        thumbnailUrl: listing.thumbnailUrl,
        createdAt: favorite.createdAt.toISOString(),
      };
    } catch (err: any) {
      throw err;
    }
  }

  async getFavorites(userId: string): Promise<FavoriteResponseDto[]> {
    const favorites = await this.prisma.favorite.findMany({
      // SEC-17: bounded result set; buyer-facing paging is a follow-up.
      take: 200,
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const cards = await this.loadListingCards(favorites.map((fav) => fav.listingId));

    return favorites.flatMap((fav) => {
      const card = cards.get(fav.listingId);
      if (!card) return [];
      return [
        {
          id: fav.id,
          listingId: card.id,
          slug: card.slug,
          title: card.title,
          askingPriceFils: card.askingPriceFils,
          status: card.status,
          thumbnailUrl: card.thumbnailUrl,
          createdAt: fav.createdAt.toISOString(),
        },
      ];
    });
  }

  async removeFavorite(userId: string, listingId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.favorite.delete({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      });
      return { success: true };
    } catch (err: any) {
      if (err.code === 'P2025') {
        throw new NotFoundException('Favorite not found');
      }
      throw err;
    }
  }

  // ==========================================
  // Saved Searches (Buyer-Owned Filters & Alerts)
  // ==========================================

  async createSavedSearch(
    userId: string,
    dto: CreateSavedSearchDto
  ): Promise<SavedSearchResponseDto> {
    const search = await this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        filterJson: dto.filterJson,
        alertsEnabled: dto.alertsEnabled || false,
      },
    });

    return {
      id: search.id,
      name: search.name,
      filterJson: search.filterJson as Record<string, any>,
      alertsEnabled: search.alertsEnabled,
      createdAt: search.createdAt.toISOString(),
      updatedAt: search.updatedAt.toISOString(),
    };
  }

  async getSavedSearches(userId: string): Promise<SavedSearchResponseDto[]> {
    const searches = await this.prisma.savedSearch.findMany({
      // SEC-17: bounded result set; buyer-facing paging is a follow-up.
      take: 200,
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return searches.map((s) => ({
      id: s.id,
      name: s.name,
      filterJson: s.filterJson as Record<string, any>,
      alertsEnabled: s.alertsEnabled,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async deleteSavedSearch(
    userId: string,
    id: string
  ): Promise<{ success: boolean }> {
    const existing = await this.prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Saved search not found');
    }

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return { success: true };
  }

  // ==========================================
  // Buyer Inquiries / Enquiries (Submitted Leads)
  // ==========================================

  async getBuyerEnquiries(userId: string): Promise<BuyerEnquiryResponseDto[]> {
    const leads = await this.prisma.lead.findMany({
      // SEC-17: bounded result set; buyer-facing paging is a follow-up.
      take: 200,
      where: { buyerUserId: userId },
      include: {
        appointments: {
          orderBy: { startsAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const cards = await this.loadListingCards(leads.map((lead) => lead.listingId));
    const grants = await this.loadLeadGrants(leads.map((lead) => lead.id));

    return leads.map((lead) => ({
      id: lead.id,
      tenantId: lead.tenantId,
      listing: {
        id: lead.listingId,
        slug: cards.get(lead.listingId)?.slug ?? '',
        title: cards.get(lead.listingId)?.title ?? 'Listing no longer available',
        dealershipName: cards.get(lead.listingId)?.dealershipName ?? 'Verified Dealership',
      },
      status: lead.status,
      intent: lead.intent,
      preferredContact: lead.preferredContact,
      buyerMessage: lead.buyerMessage,
      grant: (() => {
        const grant = grants.get(lead.id);
        return grant
          ? {
              id: grant.id,
              fieldsGranted: grant.fieldsGranted,
              purpose: grant.purpose,
              consentTextVer: grant.consentTextVer,
              grantedAt: grant.grantedAt.toISOString(),
              revokedAt: grant.revokedAt ? grant.revokedAt.toISOString() : null,
            }
          : null;
      })(),
      appointments: lead.appointments.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        leadId: a.leadId,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        status: a.status,
        note: a.note,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));
  }

  // ==========================================
  // Test-Drive Appointment Request (Buyer-Initiated)
  // ==========================================

  async requestAppointment(
    userId: string,
    leadId: string,
    dto: CreateAppointmentDto
  ): Promise<AppointmentResponseDto> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.buyerUserId !== userId) {
      throw new NotFoundException('Lead inquiry not found for this buyer');
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid timestamp format');
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException('Appointment end time must be after start time');
    }

    const appointment = await runWithDbContext({ tenantId: lead.tenantId, userId }, () =>
      this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          tenantId: lead.tenantId,
          leadId: lead.id,
          buyerUserId: userId,
          startsAt,
          endsAt,
          status: AppointmentStatus.REQUESTED,
          note: dto.note || null,
        },
      });

      // Outbox Event
      await tx.outboxEvent.create({
        data: {
          tenantId: lead.tenantId,
          aggregateType: 'appointment',
          aggregateId: appt.id,
          eventType: 'appointment.requested',
          payload: {
            appointmentId: appt.id,
            leadId: lead.id,
            tenantId: lead.tenantId,
            startsAt: appt.startsAt.toISOString(),
            endsAt: appt.endsAt.toISOString(),
          },
        },
      });

      // Audit Event
      await tx.auditEvent.create({
        data: {
          tenantId: lead.tenantId,
          actorUserId: userId,
          action: 'APPOINTMENT_REQUESTED',
          targetType: 'appointment',
          targetId: appt.id,
          metadata: {
            leadId: lead.id,
            startsAt: appt.startsAt.toISOString(),
          },
        },
      });

      return appt;
    })
    );

    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      leadId: appointment.leadId,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      note: appointment.note,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  // ==========================================
  // Buyer Appointments Listing, Cancel & Reschedule
  // ==========================================

  async getBuyerAppointments(userId: string): Promise<any[]> {
    const appointments = await this.prisma.appointment.findMany({
      // SEC-17: bounded result set; buyer-facing paging is a follow-up.
      take: 200,
      where: { buyerUserId: userId },
      include: {
        lead: { select: { listingId: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
    // Thumbnail must be public photo media only (MK-10); never documents or private uploads.
    const cards = await this.loadListingCards(
      appointments.map((a) => a.lead?.listingId).filter((id): id is string => Boolean(id))
    );

    return appointments.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      leadId: a.leadId,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      status: a.status,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      listing: (() => {
        const card = a.lead?.listingId ? cards.get(a.lead.listingId) : undefined;
        return card
          ? {
              id: card.id,
              slug: card.slug,
              title: card.title,
              vinMasked: card.vinMasked,
              imageUrl: card.thumbnailUrl,
              dealershipName: card.dealershipName || 'Verified Dealership',
            }
          : null;
      })(),
    }));
  }

  async cancelAppointment(
    userId: string,
    appointmentId: string,
    reason?: string
  ): Promise<AppointmentResponseDto> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing || existing.buyerUserId !== userId) {
      throw new NotFoundException('Appointment not found for this buyer');
    }

    const updated = await runWithDbContext({ tenantId: existing.tenantId, userId }, () =>
      this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });

      await tx.outboxEvent.create({
        data: {
          tenantId: appt.tenantId,
          aggregateType: 'appointment',
          aggregateId: appt.id,
          eventType: 'appointment.cancelled',
          payload: {
            appointmentId: appt.id,
            leadId: appt.leadId,
            tenantId: appt.tenantId,
            buyerUserId: userId,
            reason: reason || 'BUYER_CANCELLED',
          },
        },
      });

      await tx.auditEvent.create({
        data: {
          tenantId: appt.tenantId,
          actorUserId: userId,
          action: 'APPOINTMENT_CANCELLED',
          targetType: 'appointment',
          targetId: appt.id,
          metadata: {
            reason: reason || 'BUYER_CANCELLED',
          },
        },
      });

      return appt;
    })
    );

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      leadId: updated.leadId,
      startsAt: updated.startsAt.toISOString(),
      endsAt: updated.endsAt.toISOString(),
      status: updated.status,
      note: updated.note,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async rescheduleAppointment(
    userId: string,
    appointmentId: string,
    startsAtStr: string,
    endsAtStr: string
  ): Promise<AppointmentResponseDto> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing || existing.buyerUserId !== userId) {
      throw new NotFoundException('Appointment not found for this buyer');
    }

    const startsAt = new Date(startsAtStr);
    const endsAt = new Date(endsAtStr);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      throw new BadRequestException('Invalid timestamp format');
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException('Appointment end time must be after start time');
    }

    const updated = await runWithDbContext({ tenantId: existing.tenantId, userId }, () =>
      this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startsAt,
          endsAt,
          status: AppointmentStatus.REQUESTED,
        },
      });

      await tx.outboxEvent.create({
        data: {
          tenantId: appt.tenantId,
          aggregateType: 'appointment',
          aggregateId: appt.id,
          eventType: 'appointment.rescheduled',
          payload: {
            appointmentId: appt.id,
            leadId: appt.leadId,
            tenantId: appt.tenantId,
            buyerUserId: userId,
            startsAt: appt.startsAt.toISOString(),
            endsAt: appt.endsAt.toISOString(),
          },
        },
      });

      await tx.auditEvent.create({
        data: {
          tenantId: appt.tenantId,
          actorUserId: userId,
          action: 'APPOINTMENT_RESCHEDULED',
          targetType: 'appointment',
          targetId: appt.id,
          metadata: {
            startsAt: appt.startsAt.toISOString(),
            endsAt: appt.endsAt.toISOString(),
          },
        },
      });

      return appt;
    })
    );

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      leadId: updated.leadId,
      startsAt: updated.startsAt.toISOString(),
      endsAt: updated.endsAt.toISOString(),
      status: updated.status,
      note: updated.note,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ==========================================
  // Data Grant Revocation (Buyer-Controlled Privacy)
  // ==========================================

  async revokeLeadGrant(
    userId: string,
    leadId: string
  ): Promise<{ success: boolean; revokedAt: string }> {
    const ownedLead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!ownedLead || ownedLead.buyerUserId !== userId) {
      throw new NotFoundException('Lead inquiry not found for this buyer');
    }

    // Grants are tenant rows; read and update them in the lead's tenant context.
    const tenantCtx = { tenantId: ownedLead.tenantId, userId };
    const lead = await runWithDbContext(tenantCtx, () =>
      this.prisma.lead.findUnique({ where: { id: leadId }, include: { grant: true } })
    );
    if (!lead) {
      throw new NotFoundException('Lead inquiry not found for this buyer');
    }

    if (!lead.grant) {
      throw new NotFoundException('No data grant found for this lead');
    }

    if (lead.grant.revokedAt) {
      return {
        success: true,
        revokedAt: lead.grant.revokedAt.toISOString(),
      };
    }

    const now = new Date();

    await runWithDbContext(tenantCtx, () =>
      this.prisma.$transaction(async (tx) => {
      await tx.leadDataGrant.update({
        where: { id: lead.grant!.id },
        data: { revokedAt: now },
      });

      await tx.outboxEvent.create({
        data: {
          tenantId: lead.tenantId,
          aggregateType: 'lead_grant',
          aggregateId: lead.grant!.id,
          eventType: 'lead.grant_revoked',
          payload: {
            leadId: lead.id,
            grantId: lead.grant!.id,
            tenantId: lead.tenantId,
            revokedAt: now.toISOString(),
          },
        },
      });

      await tx.auditEvent.create({
        data: {
          tenantId: lead.tenantId,
          actorUserId: userId,
          action: 'LEAD_GRANT_REVOKED',
          targetType: 'lead_grant',
          targetId: lead.grant!.id,
          metadata: {
            leadId: lead.id,
            revokedAt: now.toISOString(),
          },
        },
      });
    })
    );

    return {
      success: true,
      revokedAt: now.toISOString(),
    };
  }

  async getAccountSettings(userId: string): Promise<AccountSettingsResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User identity not found');
    }

    const buyer = user.buyer;

    return {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      phoneE164: user.phoneE164,
      affiliation: buyer?.corporateAffiliation || null,
      trn: buyer?.trn || null,
      settlementCurrency: buyer?.settlementCurrency || 'AED',
      escrowIban: buyer?.escrowIban || null,
      garageVisibility: buyer?.garageVisibility ?? true,
      aecbRefreshConsent: buyer?.aecbRefreshConsent ?? false,
      // No buyer row means the user never opted in (MK-09).
      whatsappCommsConsent: buyer?.whatsappCommsConsent ?? false,
      updatedAt: (buyer?.updatedAt || user.updatedAt).toISOString(),
    };
  }

  async updateAccountSettings(
    userId: string,
    dto: UpdateAccountSettingsDto
  ): Promise<AccountSettingsResponseDto> {
    // 1. If firstName/lastName/handle provided, update user displayName
    let displayNameUpdate: string | undefined;
    if (dto.handle) {
      displayNameUpdate = dto.handle;
    } else if (dto.firstName || dto.lastName) {
      displayNameUpdate = [dto.firstName, dto.lastName].filter(Boolean).join(' ');
    }

    if (displayNameUpdate) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { displayName: displayNameUpdate },
      });
    }

    // 2. Upsert buyer settings
    const buyer = await this.prisma.buyerProfile.upsert({
      where: { userId },
      create: {
        userId,
        corporateAffiliation: dto.affiliation,
        trn: dto.trn,
        settlementCurrency: dto.settlementCurrency || 'AED',
        escrowIban: dto.escrowIban,
        garageVisibility: dto.garageVisibility ?? true,
        aecbRefreshConsent: dto.aecbRefresh ?? false,
        whatsappCommsConsent: dto.whatsappComms ?? false,
      },
      update: {
        corporateAffiliation: dto.affiliation !== undefined ? dto.affiliation : undefined,
        trn: dto.trn !== undefined ? dto.trn : undefined,
        settlementCurrency: dto.settlementCurrency !== undefined ? dto.settlementCurrency : undefined,
        escrowIban: dto.escrowIban !== undefined ? dto.escrowIban : undefined,
        garageVisibility: dto.garageVisibility !== undefined ? dto.garageVisibility : undefined,
        aecbRefreshConsent: dto.aecbRefresh !== undefined ? dto.aecbRefresh : undefined,
        whatsappCommsConsent: dto.whatsappComms !== undefined ? dto.whatsappComms : undefined,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return {
      userId,
      displayName: user?.displayName || displayNameUpdate || 'User',
      email: user?.email || null,
      phoneE164: user?.phoneE164 || null,
      affiliation: buyer.corporateAffiliation,
      trn: buyer.trn,
      settlementCurrency: buyer.settlementCurrency,
      escrowIban: buyer.escrowIban,
      garageVisibility: buyer.garageVisibility,
      aecbRefreshConsent: buyer.aecbRefreshConsent,
      whatsappCommsConsent: buyer.whatsappCommsConsent,
      updatedAt: buyer.updatedAt.toISOString(),
    };
  }

  private mapBuyerProfile(profile: any): BuyerProfileResponseDto {
    return {
      userId: profile.userId,
      preferredLanguage: profile.preferredLanguage,
      preferredEmirate: profile.preferredEmirate,
      budgetMinFils: profile.budgetMinFils
        ? profile.budgetMinFils.toString()
        : null,
      budgetMaxFils: profile.budgetMaxFils
        ? profile.budgetMaxFils.toString()
        : null,
      preferredMakes: profile.preferredMakes,
      marketingConsentAt: profile.marketingConsentAt
        ? profile.marketingConsentAt.toISOString()
        : null,
    };
  }
}

interface ListingCard {
  id: string;
  slug: string;
  title: string;
  askingPriceFils: string;
  status: ListingStatus;
  dealershipName: string | null;
  vinMasked: string | null;
  thumbnailUrl: string | null;
}

interface LeadGrantRow {
  id: string;
  leadId: string;
  fieldsGranted: string[];
  purpose: string;
  consentTextVer: string;
  grantedAt: Date;
  revokedAt: Date | null;
}
