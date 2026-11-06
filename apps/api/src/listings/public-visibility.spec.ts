import { NotFoundException } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { TenantsService } from '../tenants/tenants.service';

/**
 * QA-LOCAL-01: the marketplace is a verified-dealer marketplace. Public reads
 * (search, listing detail, storefront) must exclude dealers whose KYB is not
 * APPROVED even when the tenant row is ACTIVE.
 */
describe('public visibility requires an APPROVED dealer', () => {
  const prisma: any = {
    listing: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn() },
    tenant: { findUnique: jest.fn() },
  };
  const listings = new ListingsService(prisma, {} as any, {} as any);
  const tenants = new TenantsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('search filters on tenant.verification.status = APPROVED', async () => {
    await listings.getPublicListings({ page: 1, limit: 20 } as any);
    const where = prisma.listing.findMany.mock.calls[0][0].where;
    expect(where.tenant).toEqual(expect.objectContaining({ status: 'ACTIVE', verification: { status: 'APPROVED' } }));
    expect(prisma.listing.count.mock.calls[0][0].where.tenant.verification).toEqual({ status: 'APPROVED' });
  });

  it('listing detail of an ACTIVE but IN_REVIEW dealer is a 404', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      status: 'PUBLISHED',
      vehicle: { stockStatus: 'AVAILABLE', media: [], branch: {}, make: {}, model: {} },
      tenant: { status: 'ACTIVE', verification: { status: 'IN_REVIEW' } },
    });
    await expect(listings.getPublicListingBySlug('some-slug')).rejects.toThrow(NotFoundException);
  });

  it('storefront of an ACTIVE but IN_REVIEW dealer is a 404', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 't1',
      slug: 'uaq-family-motors',
      status: 'ACTIVE',
      verification: { status: 'IN_REVIEW' },
      branches: [],
      listings: [],
    });
    await expect(tenants.getPublicDealerBySlug('uaq-family-motors')).rejects.toThrow(NotFoundException);
  });
});
