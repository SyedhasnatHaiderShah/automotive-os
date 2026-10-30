import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { OutboxService } from '../src/listings/outbox.service';
import {
  ListingStatus,
  MediaKind,
  StockStatus,
  VehicleCondition,
} from '@automotive-os/database';

describe('Inventory & Listings Module (E2E Integration & Tenant Isolation Tests)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let outboxService: OutboxService;

  let dealerAToken: string;
  let dealerBToken: string;
  let buyerAToken: string;
  let adminToken: string;

  const tenantAId = '11111111-1111-1111-1111-111111111111';
  const branchAId = '11111111-1111-1111-1111-000000000001';
  const tenantBId = '22222222-2222-2222-2222-222222222222';
  const branchBId = '22222222-2222-2222-2222-000000000001';

  let toyotaMakeId: string;
  let landCruiserModelId: string;

  // Variables populated across test phases
  let createdVehicleId: string;
  let createdMediaId: string;
  let createdListingId: string;
  let createdListingSlug: string;

  beforeAll(async () => {
    process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'test-r2-key';
    process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'test-r2-secret-1234567890';
    process.env.R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://test-account.r2.cloudflarestorage.com';
    process.env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'automotive-os-media-staging';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);
    outboxService = app.get<OutboxService>(OutboxService);

    // Auth Tokens
    dealerAToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_a_tariq',
      email: 'tariq@alfuttaim-prestige.ae',
      name: 'Tariq Al-Hashimi',
    });

    dealerBToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_b_zayd',
      email: 'zayd@gargash-autos.ae',
      name: 'Zayd Mansoor',
    });

    buyerAToken = authService.generateDevToken({
      identitySubject: 'auth0|buyer_a_rashid',
      email: 'rashid.buyer@example.ae',
      name: 'Rashid Al-Maktoum',
    });

    adminToken = authService.generateDevToken({
      identitySubject: 'auth0|platform_admin',
      email: 'admin@autonexa.ae',
      name: 'Maryam Al-Sabah',
    });

    // Lookup taxonomy catalog
    const toyota = await prisma.make.findUniqueOrThrow({
      where: { slug: 'toyota' },
      include: { models: true },
    });
    toyotaMakeId = toyota.id;
    landCruiserModelId = toyota.models.find((m) => m.slug === 'land-cruiser')!.id;

    // Clean up any residual test vehicle from prior runs
    const existingTestVehicles = await prisma.vehicle.findMany({
      where: {
        stockNumber: { in: ['TEST-VEH-001', 'TEST-VEH-ISOLATION'] },
      },
    });
    for (const tv of existingTestVehicles) {
      await prisma.vehicleMedia.deleteMany({ where: { vehicleId: tv.id } });
      await prisma.listing.deleteMany({ where: { vehicleId: tv.id } });
      await prisma.vehicle.delete({ where: { id: tv.id } });
    }
  });

  afterAll(async () => {
    // Cleanup created test records
    if (createdVehicleId) {
      await prisma.vehicleMedia.deleteMany({ where: { vehicleId: createdVehicleId } });
      await prisma.listing.deleteMany({ where: { vehicleId: createdVehicleId } });
      await prisma.vehicle.deleteMany({ where: { id: createdVehicleId } });
    }
    await app.close();
  });

  describe('1. Tenant-Scoped Inventory Management (CRUD)', () => {
    it('Dealer A successfully creates a vehicle in their branch', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          branchId: branchAId,
          makeId: toyotaMakeId,
          modelId: landCruiserModelId,
          vin: '1GNEK1337TEST001',
          stockNumber: 'TEST-VEH-001',
          trim: 'VXR Special Edition',
          modelYear: 2024,
          condition: VehicleCondition.NEW,
          mileageKm: 25,
          colorExterior: 'Onyx Black',
          purchaseCostFils: 28000000, // 280,000 AED (private)
          askingPriceFils: 32000000, // 320,000 AED
          stockStatus: StockStatus.AVAILABLE,
          gccSpec: true,
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.tenantId).toBe(tenantAId);
      expect(response.body.stockNumber).toBe('TEST-VEH-001');
      expect(response.body.purchaseCostFils).toBe('28000000');
      expect(response.body.askingPriceFils).toBe('32000000');
      expect(response.body.stockStatus).toBe(StockStatus.AVAILABLE);

      createdVehicleId = response.body.id;
    });

    it('Dealer A lists vehicles within their tenant scope', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/vehicles`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
      const found = response.body.items.find((v: any) => v.id === createdVehicleId);
      expect(found).toBeDefined();
      expect(found.tenantId).toBe(tenantAId);
    });

    it('Dealer A retrieves specific vehicle by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdVehicleId);
      expect(response.body.makeName).toBe('Toyota');
      expect(response.body.modelName).toBe('Land Cruiser');
    });

    it('Dealer A updates vehicle asking price and trim', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          trim: 'VXR Special Edition Platinum',
          askingPriceFils: 32500000,
        })
        .expect(200);

      expect(response.body.trim).toBe('VXR Special Edition Platinum');
      expect(response.body.askingPriceFils).toBe('32500000');
    });
  });

  describe('2. Negative Authorization & Cross-Tenant Isolation', () => {
    it('Dealer A cannot read Dealer B inventory (403 TENANT_FORBIDDEN)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantBId}/vehicles`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(403);

      expect(response.body.error.message).toContain('TENANT_FORBIDDEN');
    });

    it('Dealer A cannot update Dealer B inventory (403 TENANT_FORBIDDEN)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantBId}/vehicles/some-vehicle-id`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ askingPriceFils: 1000000 })
        .expect(403);

      expect(response.body.error.message).toContain('TENANT_FORBIDDEN');
    });

    it('Dealer A querying Dealer B vehicle under Dealer A route returns 404 (Composite Key Isolation)', async () => {
      const dealerBVehicleId = '22222222-2222-2222-2222-bbbb00000001';
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/vehicles/${dealerBVehicleId}`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(404);
    });

    it('Dealer A cannot ingest a vehicle using Dealer B branch ID', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          branchId: branchBId, // Foreign branch!
          makeId: toyotaMakeId,
          modelId: landCruiserModelId,
          stockNumber: 'TEST-CROSS-BRANCH',
          modelYear: 2024,
          condition: VehicleCondition.NEW,
          askingPriceFils: 30000000,
        })
        .expect(400);
    });

    it('Global Buyer cannot access tenant inventory endpoints', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/vehicles`)
        .set('Authorization', `Bearer ${buyerAToken}`)
        .expect(403);
    });
  });

  describe('3. Private Media Upload Pattern', () => {
    it('Dealer A generates signed upload descriptor for public exterior image', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}/media`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          kind: MediaKind.EXTERIOR,
          fileName: 'front_angle_shot.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 2 * 1024 * 1024,
          altText: 'Front 3/4 Exterior Angle',
          sortOrder: 1,
          isPublic: true,
        })
        .expect(201);

      expect(response.body.mediaId).toBeDefined();
      expect(response.body.objectKey).toContain(`tenants/${tenantAId}/vehicles/${createdVehicleId}`);
      expect(response.body.uploadUrl).toMatch(/X-Amz-Algorithm|signed-upload-token/);
      expect(response.body.isPublic).toBe(true);

      createdMediaId = response.body.mediaId;
    });

    it('Dealer A generates upload descriptor for confidential dealer invoice (isPublic: false)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}/media`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          kind: MediaKind.DOCUMENT,
          fileName: 'confidential_customs_declaration.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 512 * 1024,
          altText: 'UAE Customs Declaration & VAT Invoice',
          sortOrder: 99,
          isPublic: false,
        })
        .expect(201);

      expect(response.body.isPublic).toBe(false);
      expect(response.body.objectKey).toContain('customs_declaration');
    });
  });

  describe('4. Draft Listing Creation & 1 Listing Per Vehicle Constraint', () => {
    it('Dealer A creates a DRAFT listing for the vehicle', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}/listing`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          title: '2024 Toyota Land Cruiser VXR Special Edition UAE GCC',
          description: 'Brand new Land Cruiser VXR with exclusive platinum trim and zero mileage.',
          askingPriceFils: 32500000,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe(ListingStatus.DRAFT);
      expect(response.body.slug).toContain('2024-toyota-land-cruiser');
      expect(response.body.qualityScore).toBeGreaterThanOrEqual(70);

      createdListingId = response.body.id;
      createdListingSlug = response.body.slug;
    });

    it('Subsequent draft request on same vehicle updates existing draft rather than duplicating', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}/listing`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          description: 'Updated comprehensive description for listing review.',
        })
        .expect(201);

      expect(response.body.id).toBe(createdListingId);
      expect(response.body.description).toBe(
        'Updated comprehensive description for listing review.'
      );
    });
  });

  describe('5. Publish Gates Validation on Submission', () => {
    it('Submission fails if vehicle has NO public exterior images', async () => {
      // Temporarily mark the exterior media as private to test gate 5
      await prisma.vehicleMedia.update({
        where: { id: createdMediaId },
        data: { isPublic: false },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/listings/${createdListingId}/submit`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(400);

      expect(response.body.error.message).toContain(
        'Listing requires at least one public exterior photo'
      );

      // Restore public exterior media
      await prisma.vehicleMedia.update({
        where: { id: createdMediaId },
        data: { isPublic: true },
      });
    });

    it('Submission fails if physical vehicle stock status is not AVAILABLE', async () => {
      // Temporarily set stockStatus to INTAKE
      await prisma.vehicle.update({
        where: { id: createdVehicleId },
        data: { stockStatus: StockStatus.INTAKE },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/listings/${createdListingId}/submit`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(400);

      expect(response.body.error.message).toContain(
        'Physical vehicle stock status must be AVAILABLE'
      );

      // Restore stockStatus to AVAILABLE
      await prisma.vehicle.update({
        where: { id: createdVehicleId },
        data: { stockStatus: StockStatus.AVAILABLE },
      });
    });

    it('Submission succeeds when all publish gates pass, transitioning to PENDING_REVIEW', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/listings/${createdListingId}/submit`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(200);

      expect(response.body.status).toBe(ListingStatus.PENDING_REVIEW);

      // Verify outbox event was recorded in DB
      const outbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: createdListingId,
          eventType: 'listing.submitted_for_review',
        },
      });
      expect(outbox).toBeDefined();
      expect(outbox?.status).toBe('PENDING');
    });

    it('Creating a second listing while first is in PENDING_REVIEW is rejected (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}/listing`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ title: 'Duplicate Attempt' })
        .expect(409);
    });
  });

  describe('6. Platform Admin Moderation & Transactional Outbox', () => {
    it('Non-admin user cannot invoke admin moderation endpoint (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/listings/${createdListingId}/decision`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({ decision: 'APPROVE' })
        .expect(403);
    });

    it('Platform admin rejecting a listing requires a reason', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/listings/${createdListingId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'REJECT', reason: '' })
        .expect(400);

      expect(response.body.error.message).toContain('Rejection reason is required');
    });

    it('Platform admin approves pending listing, recording outbox event and audit log', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/listings/${createdListingId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVE' })
        .expect(200);

      expect(response.body.status).toBe(ListingStatus.PUBLISHED);
      expect(response.body.publishedAt).toBeDefined();
      expect(response.body.verifiedAt).toBeDefined();

      // Verify listing.published outbox event
      const publishedOutbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: createdListingId,
          eventType: 'listing.published',
        },
      });
      expect(publishedOutbox).toBeDefined();

      // Verify audit event
      const auditLog = await prisma.auditEvent.findFirst({
        where: {
          targetId: createdListingId,
          action: 'LISTING_APPROVED',
        },
      });
      expect(auditLog).toBeDefined();
    });
  });

  describe('7. Public Redacted Listing Search & Detail', () => {
    it('Guest searches published listings and receives redacted summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/public/listings?emirate=Dubai&make=Toyota')
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(1);

      const item = response.body.items.find((i: any) => i.id === createdListingId);
      expect(item).toBeDefined();
      expect(item.price.currency).toBe('AED');
      expect(item.price.amountFils).toBe('32500000');
      expect(item.seller.verified).toBe(true);
      expect(item.seller.displayName).toBe('Al Futtaim Prestige Motors');

      // STRICT REDACTION VERIFICATION:
      // 1. purchaseCostFils must NEVER appear
      expect(item.purchaseCostFils).toBeUndefined();
      // 2. Private documents must NOT appear in public media
      const hasPrivateDocs = item.media.some((m: any) => m.kind === MediaKind.DOCUMENT);
      expect(hasPrivateDocs).toBe(false);
      // 3. Full VIN must NOT be on summary
      expect(item.vin).toBeUndefined();
    });

    it('Guest gets public listing detail by slug with masked VIN and redacted confidential fields', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/public/listings/${createdListingSlug}`)
        .expect(200);

      expect(response.body.id).toBe(createdListingId);
      expect(response.body.slug).toBe(createdListingSlug);
      expect(response.body.makeName).toBe('Toyota');
      expect(response.body.modelName).toBe('Land Cruiser');

      // Masked VIN check: prefix visible, sequence masked
      expect(response.body.maskedVin).toBe('1GNEK1337********');

      // STRICT CONFIDENTIALITY CHECKS:
      expect(response.body.purchaseCostFils).toBeUndefined();
      expect(response.body.privateNotes).toBeUndefined();
      expect(response.body.internalStockNumber).toBeUndefined();

      // Media should only contain public items
      expect(response.body.media.length).toBe(1);
      expect(response.body.media[0].kind).toBe(MediaKind.EXTERIOR);
    });
  });

  describe('8. Authoritative Stock Status & Prompt Unpublish Sync', () => {
    it('Dealer transitions vehicle to SOLD; listing is promptly unpublished atomically', async () => {
      // Dealer A marks vehicle as SOLD in stock ledger
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantAId}/vehicles/${createdVehicleId}`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .send({
          stockStatus: StockStatus.SOLD,
        })
        .expect(200);

      expect(updateResponse.body.stockStatus).toBe(StockStatus.SOLD);

      // Verify listing in DB transitioned to SOLD
      const dbListing = await prisma.listing.findUnique({
        where: { id: createdListingId },
      });
      expect(dbListing?.status).toBe(ListingStatus.SOLD);

      // Verify outbox event 'listing.unpublished' was created atomically
      const unpublishOutbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: createdListingId,
          eventType: 'listing.unpublished',
        },
      });
      expect(unpublishOutbox).toBeDefined();

      // Verify vehicle is IMMEDIATELY removed from public marketplace search
      const publicSearchResponse = await request(app.getHttpServer())
        .get('/api/v1/public/listings?make=Toyota')
        .expect(200);

      const foundInPublic = publicSearchResponse.body.items.some(
        (i: any) => i.id === createdListingId
      );
      expect(foundInPublic).toBe(false);

      // Verify slug detail endpoint immediately returns 404
      await request(app.getHttpServer())
        .get(`/api/v1/public/listings/${createdListingSlug}`)
        .expect(404);
    });

    it('Outbox worker processes pending events reliably', async () => {
      const processedCount = await outboxService.processPendingEvents(50);
      expect(processedCount).toBeGreaterThanOrEqual(1);

      // Check all outbox events for this listing are now SENT
      const events = await prisma.outboxEvent.findMany({
        where: { aggregateId: createdListingId },
      });
      for (const ev of events) {
        expect(ev.status).toBe('SENT');
        expect(ev.processedAt).toBeInstanceOf(Date);
      }
    });
  });
});
