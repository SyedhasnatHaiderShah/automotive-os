import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@automotive-os/database';
import { AdminDataService } from './admin-data.service';
import { DATA_REGISTRY, getModelMeta } from './admin-data.registry';

describe('admin data console registry (AD-20)', () => {
  it('covers every Prisma model', () => {
    expect([...DATA_REGISTRY.keys()].sort()).toEqual(Prisma.dmmf.datamodel.models.map((m) => m.name).sort());
  });

  it('never exposes secret columns', () => {
    const user = getModelMeta('User')!.fields.map((f) => f.name);
    expect(user).not.toContain('passwordHash');
    expect(user).not.toContain('mfaSecret');
    expect(user).not.toContain('emailVerificationTokenHash');
    expect(getModelMeta('Session')!.fields.map((f) => f.name)).not.toContain('tokenHash');
    expect(getModelMeta('UserInvitation')!.fields.map((f) => f.name)).not.toContain('tokenHash');
  });

  it('marks ids and timestamps read-only and keeps foreign keys editable', () => {
    const vehicle = getModelMeta('Vehicle')!;
    const byName = Object.fromEntries(vehicle.fields.map((f) => [f.name, f]));
    expect(byName.id.readOnly).toBe(true);
    expect(byName.createdAt.readOnly).toBe(true);
    expect(byName.updatedAt.readOnly).toBe(true);
    expect(byName.tenantId.readOnly).toBe(false);
    expect(byName.tenantId.isForeignKey).toBe(true);
    expect(byName.tenantId.references).toBe('Tenant');
    expect(byName.stockStatus.enumValues).toContain('AVAILABLE');
    expect(vehicle.labelField).toBe('stockNumber');
  });
});

describe('AdminDataService', () => {
  const vehicleDelegate = { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const userDelegate = { findUnique: jest.fn(), count: jest.fn(), delete: jest.fn() };
  const prisma: any = {
    vehicle: vehicleDelegate,
    user: userDelegate,
    $transaction: jest.fn((cb: any) => cb(prisma)),
  };
  const audit = { logAction: jest.fn().mockResolvedValue(undefined) };
  const service = new AdminDataService(prisma, audit as any);
  const admin = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => jest.clearAllMocks());

  it('rejects unknown tables with 404', async () => {
    await expect(service.get('Secrets', admin)).rejects.toThrow(NotFoundException);
  });

  it('serialises BigInt and Date values for JSON', async () => {
    vehicleDelegate.findMany.mockResolvedValue([{ id: 'v1', askingPriceFils: BigInt(12345), createdAt: new Date('2026-01-01T00:00:00Z'), stockStatus: 'AVAILABLE' }]);
    vehicleDelegate.count.mockResolvedValue(1);
    const page = await service.list('Vehicle', { page: 1, limit: 10 });
    expect(page.items[0].askingPriceFils).toBe('12345');
    expect(page.items[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(page.total).toBe(1);
  });

  it('searches text columns, ids and enum values and caps the page size', async () => {
    vehicleDelegate.findMany.mockResolvedValue([]);
    vehicleDelegate.count.mockResolvedValue(0);
    await service.list('Vehicle', { page: 1, limit: 5000, q: 'available' });
    const args = vehicleDelegate.findMany.mock.calls[0][0];
    expect(args.take).toBe(100);
    expect(args.where.OR).toEqual(expect.arrayContaining([{ stockStatus: 'AVAILABLE' }, { stockNumber: { contains: 'available', mode: 'insensitive' } }]));
  });

  it('coerces create input, rejects read-only and unknown fields, and audits in the transaction', async () => {
    vehicleDelegate.create.mockImplementation(async ({ data }: any) => ({ id: 'new-id', ...data }));
    const created = await service.create(
      'Vehicle',
      {
        tenantId: '22222222-2222-4222-8222-222222222222',
        branchId: '33333333-3333-4333-8333-333333333333',
        makeId: '44444444-4444-4444-8444-444444444444',
        modelId: '55555555-5555-4555-8555-555555555555',
        stockNumber: 'QA-1',
        modelYear: '2025',
        condition: 'new',
        askingPriceFils: '12000000',
        gccSpec: 'true',
      },
      admin,
    );
    const data = vehicleDelegate.create.mock.calls[0][0].data;
    expect(data.modelYear).toBe(2025);
    expect(data.condition).toBe('NEW');
    expect(data.askingPriceFils).toBe(BigInt(12000000));
    expect(data.gccSpec).toBe(true);
    expect(created.askingPriceFils).toBe('12000000');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(audit.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'PLATFORM_ADMIN_DATA_CREATE', targetType: 'Vehicle', targetId: 'new-id', actorUserId: admin }));

    await expect(service.create('Vehicle', { id: 'x', stockNumber: 'QA-2' }, admin)).rejects.toThrow(BadRequestException);
    await expect(service.create('Vehicle', { passwordHash: 'x' }, admin)).rejects.toThrow(BadRequestException);
    const missing = await service.create('Vehicle', { stockNumber: 'QA-3' }, admin).catch((e) => e);
    expect(missing).toBeInstanceOf(BadRequestException);
    expect(JSON.stringify(missing.getResponse())).toMatch(/tenantId: required/);
  });

  it('maps unique violations to 409', async () => {
    vehicleDelegate.findUnique.mockResolvedValue({ id: 'v1', stockNumber: 'A' });
    vehicleDelegate.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x', meta: { target: ['stock_number'] } }));
    await expect(service.update('Vehicle', '66666666-6666-4666-8666-666666666666', { stockNumber: 'B' }, admin)).rejects.toThrow(ConflictException);
  });

  it('refuses to delete the signed-in admin or the last active platform admin', async () => {
    userDelegate.findUnique.mockResolvedValue({ id: admin, isPlatformAdmin: true, status: 'ACTIVE' });
    await expect(service.remove('User', admin, admin)).rejects.toThrow(/CANNOT_MODIFY_OWN_ACCOUNT/);
    const other = '77777777-7777-4777-8777-777777777777';
    userDelegate.findUnique.mockResolvedValue({ id: other, isPlatformAdmin: true, status: 'ACTIVE' });
    userDelegate.count.mockResolvedValue(0);
    await expect(service.remove('User', other, admin)).rejects.toThrow(/CANNOT_DISABLE_LAST_PLATFORM_ADMIN/);
    expect(userDelegate.delete).not.toHaveBeenCalled();
  });
});
