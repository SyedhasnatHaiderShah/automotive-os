import { Test, TestingModule } from '@nestjs/testing';
import { PublicMediaController } from './public-media.controller';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'node:stream';

describe('PublicMediaController (SEC-22)', () => {
  let controller: PublicMediaController;
  let prisma: {
    vehicleMedia: {
      findFirst: jest.Mock;
    };
  };

  const mockS3Send = jest.fn();

  beforeEach(async () => {
    process.env.R2_ACCESS_KEY_ID = 'test-key-id';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
    process.env.R2_ENDPOINT = 'https://s3.example.com';
    process.env.R2_BUCKET_NAME = 'test-bucket';

    prisma = {
      vehicleMedia: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicMediaController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<PublicMediaController>(PublicMediaController);
    (controller as any).s3Client = {
      send: mockS3Send,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockRes() {
    const headers: Record<string, any> = {};
    return {
      setHeader: jest.fn((k: string, v: any) => {
        headers[k] = v;
      }),
      headers,
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      end: jest.fn(),
      write: jest.fn(),
    } as any;
  }

  it('rejects path traversal attempts with BadRequestException', async () => {
    const badPaths = [
      '/api/v1/public/media/../secret.env',
      '/api/v1/public/media/sub/..%2fsecret.key',
      '/api/v1/public/media/sub\\secret.key',
      '/api/v1/public/media/valid\0nullbyte',
    ];

    for (const path of badPaths) {
      const req = { path } as any;
      const res = createMockRes();
      await expect(controller.getPublicMedia(req, res)).rejects.toThrow(
        BadRequestException,
      );
    }
  });

  it('rejects if no object key is provided', async () => {
    const req = { path: '/api/v1/public/media/' } as any;
    const res = createMockRes();
    await expect(controller.getPublicMedia(req, res)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('streams media if media is public, tenant is ACTIVE, and vehicle is AVAILABLE', async () => {
    const req = { path: '/api/v1/public/media/dealers/abc/photo.jpg' } as any;
    const res = createMockRes();

    prisma.vehicleMedia.findFirst.mockResolvedValue({
      id: 'media-1',
      objectKey: 'dealers/abc/photo.jpg',
      isPublic: true,
      kind: 'EXTERIOR',
      tenantId: 'tenant-1',
    });

    const stream = new Readable();
    stream.push('image-data');
    stream.push(null);

    mockS3Send.mockResolvedValue({
      ContentType: 'image/jpeg',
      ContentLength: 10,
      ETag: '"etag-123"',
      Body: stream,
    });

    await controller.getPublicMedia(req, res);

    expect(prisma.vehicleMedia.findFirst).toHaveBeenCalledWith({
      where: {
        objectKey: 'dealers/abc/photo.jpg',
        isPublic: true,
        kind: { not: 'DOCUMENT' },
        tenant: { status: 'ACTIVE' },
        vehicle: { stockStatus: 'AVAILABLE' },
      },
    });

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Length', 10);
    expect(res.setHeader).toHaveBeenCalledWith('ETag', '"etag-123"');
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('throws NotFoundException when media is not found (or fails tenant/stock conditions)', async () => {
    const req = { path: '/api/v1/public/media/dealers/abc/sold-or-suspended.jpg' } as any;
    const res = createMockRes();

    prisma.vehicleMedia.findFirst.mockResolvedValue(null);

    await expect(controller.getPublicMedia(req, res)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockS3Send).not.toHaveBeenCalled();
  });
});
