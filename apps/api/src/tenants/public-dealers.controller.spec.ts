import { NotFoundException } from '@nestjs/common';
import { PublicDealersController } from './public-dealers.controller';
import { TenantsService } from './tenants.service';
import { TenantStatus, VerificationStatus } from '@automotive-os/database';

describe('PublicDealersController', () => {
  let controller: PublicDealersController;
  let service: TenantsService;

  const mockPrisma: any = {
    tenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    service = new TenantsService(mockPrisma);
    controller = new PublicDealersController(service);
  });

  it('should return verified dealership storefront profile for valid active dealer', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'al-futtaim-prestige',
      legalName: 'Al Futtaim Prestige Motors LLC',
      displayName: 'Al Futtaim Prestige Motors',
      country: 'AE',
      currency: 'AED',
      status: TenantStatus.ACTIVE,
      verification: {
        status: VerificationStatus.APPROVED,
        tradeLicenseRef: 'TL-DXB-987654',
        licenseExpiry: new Date('2028-12-31'),
        jurisdiction: 'Dubai DED',
      },
      branches: [
        {
          id: 'branch-1',
          name: 'Sheikh Zayed Road Flagship',
          emirate: 'Dubai',
          city: 'Dubai',
          address: 'Sheikh Zayed Rd, Exit 45, Dubai, UAE',
          latitude: '25.1972',
          longitude: '55.2744',
        },
      ],
      listings: [
        { askingPriceFils: BigInt(89500000) },
        { askingPriceFils: BigInt(169000000) },
      ],
    });

    const result = await controller.getPublicDealerBySlug('al-futtaim-prestige');

    expect(result).toBeDefined();
    expect(result.slug).toBe('al-futtaim-prestige');
    expect(result.displayName).toBe('Al Futtaim Prestige Motors');
    expect(result.verification?.isKybVerified).toBe(true);
    expect(result.verification?.tradeLicenseRef).toBe('TL-DXB-987654');
    expect(result.stats.liveGroundedStock).toBe(2);
    expect(result.stats.inventoryValueFils).toBe('258500000');
    expect(result.branches.length).toBe(1);
    expect(result.branches[0].emirate).toBe('Dubai');
  });

  it('should throw NotFoundException if dealer does not exist or is inactive', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);

    await expect(controller.getPublicDealerBySlug('non-existent-dealer')).rejects.toThrow(
      NotFoundException
    );
  });

  it('should throw NotFoundException if dealer is suspended or pending', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      slug: 'suspended-dealer',
      status: TenantStatus.SUSPENDED,
    });

    await expect(controller.getPublicDealerBySlug('suspended-dealer')).rejects.toThrow(
      NotFoundException
    );
  });
});
