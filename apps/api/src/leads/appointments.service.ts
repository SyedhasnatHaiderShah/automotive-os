import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentResponseDto } from '../me/dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async listTenantAppointments(
    tenantId: string
  ): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId },
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
    }));
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
