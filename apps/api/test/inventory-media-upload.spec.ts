import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { VehiclesService } from '../src/inventory/vehicles.service';
import { PrismaService } from '../src/database/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { MediaKind } from '@automotive-os/database';

describe('VehiclesService - Media Upload & R2 Pre-signing Hardening', () => {
  let vehiclesService: VehiclesService;
  let mockPrisma: any;
  let mockAudit: any;

  const originalEnv = { ...process.env };
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const vehicleId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_BUCKET;

    mockPrisma = {
      vehicle: {
        findUnique: jest.fn(),
      },
      vehicleMedia: {
        create: jest.fn(),
      },
    };

    mockAudit = {
      recordEvent: jest.fn().mockResolvedValue(undefined),
    };

    vehiclesService = new VehiclesService(mockPrisma as unknown as PrismaService, mockAudit as unknown as AuditService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects upload when vehicle does not exist in the tenant scope', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      vehiclesService.registerMediaUpload(tenantId, vehicleId, {
        kind: MediaKind.EXTERIOR,
        fileName: 'car-front.jpg',
        contentType: 'image/jpeg',
        fileSizeBytes: 1024,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockPrisma.vehicle.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_id: {
          tenantId,
          id: vehicleId,
        },
      },
    });
  });

  it('rejects upload when file extension does not match content type', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      tenantId,
      media: [],
    });

    await expect(
      vehiclesService.registerMediaUpload(tenantId, vehicleId, {
        kind: MediaKind.EXTERIOR,
        fileName: 'car-front.png', // Mismatch: declared as image/jpeg but has .png extension
        contentType: 'image/jpeg',
        fileSizeBytes: 1024,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects upload when image exceeds 15MB limit', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      tenantId,
      media: [],
    });

    await expect(
      vehiclesService.registerMediaUpload(tenantId, vehicleId, {
        kind: MediaKind.EXTERIOR,
        fileName: 'large-photo.jpg',
        contentType: 'image/jpeg',
        fileSizeBytes: 16 * 1024 * 1024, // 16MB > 15MB limit
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects upload when PDF exceeds 50MB limit', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      tenantId,
      media: [],
    });

    await expect(
      vehiclesService.registerMediaUpload(tenantId, vehicleId, {
        kind: MediaKind.DOCUMENT,
        fileName: 'huge-manual.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 52 * 1024 * 1024, // 52MB > 50MB limit
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('fails closed with ServiceUnavailableException when R2 credentials are unset', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      tenantId,
      media: [],
    });

    await expect(
      vehiclesService.registerMediaUpload(tenantId, vehicleId, {
        kind: MediaKind.EXTERIOR,
        fileName: 'valid-car.jpg',
        contentType: 'image/jpeg',
        fileSizeBytes: 2 * 1024 * 1024,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('generates authentic pre-signed SigV4 PUT URL when R2 credentials are valid', async () => {
    process.env.R2_ACCESS_KEY_ID = 'test-r2-access-key-id';
    process.env.R2_SECRET_ACCESS_KEY = 'test-r2-secret-access-key-1234567890';
    process.env.R2_ENDPOINT = 'https://tenant1234.r2.cloudflarestorage.com';
    process.env.R2_BUCKET_NAME = 'automotive-os-media-staging';

    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: vehicleId,
      tenantId,
      media: [{ sortOrder: 0 }],
    });

    mockPrisma.vehicleMedia.create.mockImplementation(({ data }: any) => {
      return Promise.resolve({
        id: 'media-999',
        ...data,
      });
    });

    const result = await vehiclesService.registerMediaUpload(tenantId, vehicleId, {
      kind: MediaKind.EXTERIOR,
      fileName: 'car-front-view.jpg',
      contentType: 'image/jpeg',
      fileSizeBytes: 1024 * 1024,
      isPublic: true,
    });

    expect(result).toBeDefined();
    expect(result.mediaId).toBe('media-999');
    expect(result.objectKey).toMatch(new RegExp(`^tenants/${tenantId}/vehicles/${vehicleId}/[a-f0-9-]+-car-front-view\\.jpg$`));
    expect(result.uploadUrl).toBeDefined();
    expect(result.uploadUrl).toContain('https://tenant1234.r2.cloudflarestorage.com/automotive-os-media-staging/');
    expect(result.uploadUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(result.uploadUrl).toContain('X-Amz-Credential=test-r2-access-key-id');
    expect(result.uploadUrl).toContain('X-Amz-Expires=900');

    expect(mockPrisma.vehicleMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        vehicleId,
        kind: MediaKind.EXTERIOR,
        objectKey: result.objectKey,
        sortOrder: 0,
        isPublic: true,
      }),
    });
  });
});
