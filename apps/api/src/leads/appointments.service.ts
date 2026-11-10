import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@automotive-os/database';
import { PrismaService, runWithDbContext } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentResponseDto, DealerAppointmentDto } from '../me/dto/create-appointment.dto';
import { assertAppointmentTransition } from './appointment-transitions';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async listTenantAppointments(
    tenantId: string,
    filters: { status?: AppointmentStatus; page?: number; limit?: number }
  ): Promise<{ items: DealerAppointmentDto[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    // SEC-17: bounded result set.
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const where = { tenantId, ...(filters.status ? { status: filters.status } : {}) };

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: { lead: { include: { listing: { select: { title: true } }, grant: true } } },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    // Buyer rows are global, so names are read elevated and only for granted leads.
    const grantedBuyerIds = [
      ...new Set(
        appointments
          .filter((a) => a.lead.grant && !a.lead.grant.revokedAt && a.lead.grant.fieldsGranted.includes('name'))
          .map((a) => a.buyerUserId)
      ),
    ];
    const buyers = grantedBuyerIds.length
      ? await runWithDbContext({ isAdmin: true }, () =>
          this.prisma.user.findMany({
            where: { id: { in: grantedBuyerIds } },
            select: { id: true, displayName: true },
          })
        )
      : [];
    const buyerNames = new Map(buyers.map((b) => [b.id, b.displayName]));

    const items = appointments.map((a) => {
      const grant = a.lead.grant;
      const isGranted = grant && !grant.revokedAt && grant.fieldsGranted.includes('name');
      return {
        id: a.id,
        tenantId: a.tenantId,
        leadId: a.leadId,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        status: a.status,
        note: a.note,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        listingTitle: a.lead.listing.title,
        buyerDisplayName: (isGranted && buyerNames.get(a.buyerUserId)) || 'Prospective Buyer',
      };
    });

    return { items, total };
  }

  async updateAppointmentStatus(
    tenantId: string,
    appointmentId: string,
    dto: UpdateAppointmentStatusDto,
    actorUserId?: string
  ): Promise<AppointmentResponseDto> {
    const existing = await this.prisma.appointment.findUnique({
      where: {
        tenantId_id: {
          tenantId,
          id: appointmentId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Appointment ${appointmentId} not found in this dealership`
      );
    }

    const previousStatus = existing.status;
    assertAppointmentTransition(previousStatus, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: {
          tenantId_id: {
            tenantId,
            id: appointmentId,
          },
        },
        data: {
          status: dto.status,
        },
      });

      // Outbox Event
      await tx.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: 'appointment',
          aggregateId: appointmentId,
          eventType: 'appointment.status_updated',
          payload: {
            appointmentId,
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
          action: 'APPOINTMENT_STATUS_UPDATED',
          targetType: 'appointment',
          targetId: appointmentId,
          metadata: {
            previousStatus,
            newStatus: dto.status,
          },
        },
      });

      return result;
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
}
