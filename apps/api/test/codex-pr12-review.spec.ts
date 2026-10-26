import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { ListingsService } from '../src/listings/listings.service';
import { ListingSearchSyncService } from '../src/listings/listing-search-sync.service';
import { ListingStatus, StockStatus, TenantStatus } from '@automotive-os/database';

describe('Codex PR #12 regressions: atomic unpublish audit and public keyword search', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const listingId = '22222222-2222-2222-2222-222222222222';
  const actorUserId = '33333333-3333-3333-3333-333333333333';
  const listing = {
    id: listingId,
    tenantId,
    vehicleId: '44444444-4444-4444-4444-444444444444',
    slug: 'test-listing',
    title: '2024 Toyota',
    description: null,
    askingPriceFils: BigInt(25000000),
    status: ListingStatus.PUBLISHED,
    qualityScore: 70,
    verifiedAt: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function fixture() {
    const tx = {
      listing: { update: jest.fn().mockResolvedValue({ ...listing, status: ListingStatus.PAUSED }) },
      outboxEvent: { create: jest.fn().mockResolvedValue({ id: 'outbox-1' }) },
      auditEvent: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const prisma = {
      listing: {
        findUnique: jest.fn().mockResolvedValue(listing),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((callback: (tx: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const audit = { logAction: jest.fn() };
    const service = new ListingsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      {} as ListingSearchSyncService,
    );
    return { tx, prisma, audit, service };
  }

  it('persists status, outbox, and audit through the same Prisma transaction', async () => {
    const { tx, prisma, audit, service } = fixture();
    const result = await service.unpublishListing(tenantId, listingId, actorUserId);
    expect(result.status).toBe(ListingStatus.PAUSED);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.listing.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId_id: { tenantId, id: listingId } },
    }));
    expect(tx.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ eventType: 'listing.unpublished', tenantId }),
    }));
    expect(tx.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tenantId, actorUserId, action: 'LISTING_UNPUBLISHED', targetId: listingId,
      }),
    }));
    expect(audit.logAction).not.toHaveBeenCalled();
  });

  it('rejects unpublish when audit insert fails (transaction callback must reject)', async () => {
    const { tx, service } = fixture();
    tx.auditEvent.create.mockRejectedValueOnce(new Error('Audit storage unavailable'));
    await expect(service.unpublishListing(tenantId, listingId, actorUserId))
      .rejects.toThrow('Audit storage unavailable');
    expect(tx.outboxEvent.create).toHaveBeenCalledTimes(1);
  });

  it('matches listing title, dealer name and vehicle branch emirate within both page and count query', async () => {
    const { prisma, service } = fixture();
    const result = await service.getPublicListings({ q: 'Dubai', page: 2, limit: 12 });
    expect(result).toMatchObject({ total: 0, page: 2, limit: 12 });
    const filters = prisma.listing.findMany.mock.calls[0][0].where;
    expect(filters).toMatchObject({
      status: ListingStatus.PUBLISHED,
      vehicle: { stockStatus: StockStatus.AVAILABLE },
      tenant: { status: TenantStatus.ACTIVE },
    });
    expect(filters.OR).toEqual(expect.arrayContaining([
      { title: { contains: 'Dubai', mode: 'insensitive' } },
      { tenant: { displayName: { contains: 'Dubai', mode: 'insensitive' } } },
      { vehicle: { branch: { emirate: { contains: 'Dubai', mode: 'insensitive' } } } },
    ]));
    expect(prisma.listing.count).toHaveBeenCalledWith({ where: filters });
    expect(prisma.listing.findMany.mock.calls[0][0]).toMatchObject({ skip: 12, take: 12 });
  });
});
