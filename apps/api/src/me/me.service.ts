import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/auth.service';
import { MeResponseDto, BuyerProfileResponseDto } from './dto/me-response.dto';
import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';
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
    const profile = await this.prisma.buyerProfile.upsert({
      where: { userId },
      update: {
        preferredLanguage: dto.preferredLanguage,
        preferredEmirate: dto.preferredEmirate,
        budgetMinFils:
          dto.budgetMinFils !== undefined ? BigInt(dto.budgetMinFils) : undefined,
        budgetMaxFils:
          dto.budgetMaxFils !== undefined ? BigInt(dto.budgetMaxFils) : undefined,
        preferredMakes: dto.preferredMakes,
      },
      create: {
        userId,
        preferredLanguage: dto.preferredLanguage || 'en',
        preferredEmirate: dto.preferredEmirate,
        budgetMinFils:
          dto.budgetMinFils !== undefined ? BigInt(dto.budgetMinFils) : null,
        budgetMaxFils:
          dto.budgetMaxFils !== undefined ? BigInt(dto.budgetMaxFils) : null,
        preferredMakes: dto.preferredMakes || [],
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
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: {
        vehicle: {
          include: {
            media: {
              where: { isPublic: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!listing) {
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
        askingPriceFils: listing.askingPriceFils.toString(),
        status: listing.status,
        thumbnailUrl: listing.vehicle.media[0]
          ? `${process.env.S3_PUBLIC_CDN_URL || 'https://cdn.automotive-os.ae'}/${listing.vehicle.media[0].objectKey}`
          : null,
        createdAt: favorite.createdAt.toISOString(),
      };
    } catch (err: any) {
      throw err;
    }
  }

  async getFavorites(userId: string): Promise<FavoriteResponseDto[]> {
    const cdnBase =
      process.env.S3_PUBLIC_CDN_URL || 'https://cdn.automotive-os.ae';
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            vehicle: {
              include: {
                media: {
                  where: { isPublic: true },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      listingId: fav.listing.id,
      slug: fav.listing.slug,
      title: fav.listing.title,
      askingPriceFils: fav.listing.askingPriceFils.toString(),
      status: fav.listing.status,
      thumbnailUrl: fav.listing.vehicle.media[0]
        ? `${cdnBase}/${fav.listing.vehicle.media[0].objectKey}`
        : null,
      createdAt: fav.createdAt.toISOString(),
    }));
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
      where: { buyerUserId: userId },
      include: {
        listing: {
          include: {
            tenant: true,
          },
        },
        grant: true,
        appointments: {
          orderBy: { startsAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      tenantId: lead.tenantId,
      listing: {
        id: lead.listing.id,
        slug: lead.listing.slug,
        title: lead.listing.title,
        dealershipName: lead.listing.tenant.displayName,
      },
      status: lead.status,
      intent: lead.intent,
      preferredContact: lead.preferredContact,
      buyerMessage: lead.buyerMessage,
      grant: lead.grant
        ? {
            id: lead.grant.id,
            fieldsGranted: lead.grant.fieldsGranted,
            purpose: lead.grant.purpose,
            consentTextVer: lead.grant.consentTextVer,
            grantedAt: lead.grant.grantedAt.toISOString(),
            revokedAt: lead.grant.revokedAt
              ? lead.grant.revokedAt.toISOString()
              : null,
          }
        : null,
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

    const appointment = await this.prisma.$transaction(async (tx) => {
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
    });

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
      where: { buyerUserId: userId },
      include: {
        lead: {
          include: {
            listing: {
              include: {
                tenant: true,
                vehicle: {
                  include: {
                    model: {
                      include: {
                        make: true,
                      },
                    },
                    media: {
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

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
      listing: a.lead?.listing
        ? {
            id: a.lead.listing.id,
            slug: a.lead.listing.slug,
            title: a.lead.listing.title,
            vinMasked: a.lead.listing.vehicle?.vin
              ? `${a.lead.listing.vehicle.vin.slice(0, 3)}•••••${a.lead.listing.vehicle.vin.slice(-4)}`
              : null,
            imageUrl: a.lead.listing.vehicle?.media?.[0]?.objectKey
              ? (a.lead.listing.vehicle.media[0].objectKey.startsWith('http')
                  ? a.lead.listing.vehicle.media[0].objectKey
                  : `https://cdn.automotive-os.ae/${a.lead.listing.vehicle.media[0].objectKey}`)
              : null,
            dealershipName: a.lead.listing.tenant?.displayName || 'Verified Dealership',
          }
        : null,
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

    const updated = await this.prisma.$transaction(async (tx) => {
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
    });

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

    const updated = await this.prisma.$transaction(async (tx) => {
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
    });

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
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { grant: true },
    });

    if (!lead || lead.buyerUserId !== userId) {
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

    await this.prisma.$transaction(async (tx) => {
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
    });

    return {
      success: true,
      revokedAt: now.toISOString(),
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
