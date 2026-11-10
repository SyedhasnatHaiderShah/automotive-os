import { ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'appt-1',
  tenantId: 'tenant-1',
  leadId: 'lead-1',
  buyerUserId: 'buyer-1',
  startsAt: new Date('2026-11-10T08:00:00Z'),
  endsAt: new Date('2026-11-10T09:00:00Z'),
  status: 'REQUESTED',
  note: null,
  createdAt: new Date('2026-11-06T08:00:00Z'),
  updatedAt: new Date('2026-11-06T08:00:00Z'),
  lead: { listing: { title: '2024 Toyota Land Cruiser' }, grant: null },
  ...overrides,
});

describe('AppointmentsService', () => {
  const build = (appointments: unknown[], existing?: unknown) => {
    const prisma: any = {
      appointment: {
        findMany: jest.fn().mockResolvedValue(appointments),
        count: jest.fn().mockResolvedValue(appointments.length),
        findUnique: jest.fn().mockResolvedValue(existing ?? null),
      },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'buyer-1', displayName: 'Rashid Obeid' }]) },
      $transaction: jest.fn(),
    };
    return { prisma, service: new AppointmentsService(prisma, {} as any) };
  };

  it('masks the buyer name when the name grant is missing, revoked or excludes it', async () => {
    const { service } = build([
      row(),
      row({ id: 'appt-2', lead: { listing: { title: 'A' }, grant: { revokedAt: new Date(), fieldsGranted: ['name'] } } }),
      row({ id: 'appt-3', lead: { listing: { title: 'B' }, grant: { revokedAt: null, fieldsGranted: ['email'] } } }),
    ]);
    const { items } = await service.listTenantAppointments('tenant-1', {});
    expect(items.map((a) => a.buyerDisplayName)).toEqual(['Prospective Buyer', 'Prospective Buyer', 'Prospective Buyer']);
    expect(JSON.stringify(items)).not.toContain('buyerUserId');
  });

  it('shows the buyer name only under an active name grant', async () => {
    const { service } = build([
      row({ lead: { listing: { title: 'A' }, grant: { revokedAt: null, fieldsGranted: ['name'] } } }),
    ]);
    const { items, total } = await service.listTenantAppointments('tenant-1', {});
    expect(items[0]).toMatchObject({ buyerDisplayName: 'Rashid Obeid', listingTitle: 'A' });
    expect(total).toBe(1);
  });

  it('scopes the list to the tenant and status with bounded paging', async () => {
    const { service, prisma } = build([]);
    await service.listTenantAppointments('tenant-1', { status: 'CONFIRMED' as any, page: 2, limit: 500 });
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', status: 'CONFIRMED' }, skip: 50, take: 50 }),
    );
  });

  it('rejects a status change a final appointment cannot make', async () => {
    const { service, prisma } = build([], row({ status: 'COMPLETED' }));
    await expect(
      service.updateAppointmentStatus('tenant-1', 'appt-1', { status: 'CONFIRMED' as any }, 'actor-1'),
    ).rejects.toThrow(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
