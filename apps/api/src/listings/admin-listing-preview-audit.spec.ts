import { ListingsService } from './listings.service';
import { resetAdminMediaPreviewClient } from './admin-media-preview.util';

describe('ListingsService.getAdminListingById private media audit (AD-08)', () => {
  const originalEnv = { ...process.env };

  const listing = {
    id: 'listing-1',
    slug: 'car-1',
    title: 'Car',
    description: null,
    askingPriceFils: BigInt(100000),
    status: 'PENDING_REVIEW',
    qualityScore: 80,
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: { id: 'tenant-1', slug: 'dealer', displayName: 'Dealer', verification: null },
    vehicle: {
      id: 'vehicle-1',
      vin: 'VIN',
      stockNumber: 'S1',
      modelYear: 2024,
      make: { name: 'Make' },
      model: { name: 'Model' },
      trim: null,
      mileageKm: 10,
      colorExterior: null,
      fuel: null,
      transmission: null,
      gccSpec: true,
      stockStatus: 'AVAILABLE',
      branch: null,
      media: [
        { id: 'm-public', objectKey: 'tenants/t/v/a.jpg', isPublic: true, kind: 'EXTERIOR' },
        { id: 'm-private', objectKey: 'tenants/t/v/doc.pdf', isPublic: false, kind: 'DOCUMENT' },
      ],
    },
  };

  function build() {
    const prisma = { listing: { findFirst: jest.fn().mockResolvedValue(listing) } };
    const audit = { logAction: jest.fn().mockResolvedValue(undefined) };
    const service = new ListingsService(prisma as any, audit as any, {} as any);
    return { service, audit };
  }

  afterEach(() => {
    process.env = { ...originalEnv };
    resetAdminMediaPreviewClient();
  });

  it('audits issued links for private media without recording the URL', async () => {
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_ENDPOINT = 'https://storage.example.test';
    process.env.R2_BUCKET_NAME = 'bucket';
    resetAdminMediaPreviewClient();
    const { service, audit } = build();

    await service.getAdminListingById('car-1', 'admin-1');

    expect(audit.logAction).toHaveBeenCalledTimes(1);
    const call = audit.logAction.mock.calls[0][0];
    expect(call).toMatchObject({
      action: 'ADMIN_PRIVATE_MEDIA_PREVIEW_ISSUED',
      actorUserId: 'admin-1',
      targetId: 'listing-1',
      metadata: { mediaIds: ['m-private'] },
    });
    expect(JSON.stringify(call)).not.toContain('X-Amz-Signature');
  });

  it('writes no audit row when storage is not configured (no link issued)', async () => {
    for (const k of ['R2_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'S3_ENDPOINT', 'R2_BUCKET_NAME', 'S3_BUCKET']) {
      delete process.env[k];
    }
    resetAdminMediaPreviewClient();
    const { service, audit } = build();

    await service.getAdminListingById('car-1', 'admin-1');

    expect(audit.logAction).not.toHaveBeenCalled();
  });
});
