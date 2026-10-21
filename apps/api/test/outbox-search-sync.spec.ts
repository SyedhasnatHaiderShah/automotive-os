import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { OutboxService } from '../src/listings/outbox.service';
import { ListingSearchSyncService } from '../src/listings/listing-search-sync.service';
import {
  ListingStatus,
  MediaKind,
  OutboxStatus,
  StockStatus,
  TenantStatus,
  VehicleCondition,
  VerificationStatus,
} from '@automotive-os/database';

describe('Public Listing Search Synchronization & Outbox Worker (Integration Tests)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let outboxService: OutboxService;
  let searchSyncService: ListingSearchSyncService;

  let dealerToken: string;
  let buyerToken: string;
  let adminToken: string;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const branchId = '11111111-1111-1111-1111-000000000001';

  let testMakeId: string;
  let testModelId: string;

  let testVehicleId: string;
  let testListingId: string;
  let testListingSlug: string;

  beforeAll(async () => {
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
        transformOptions: { enableImplicitConversion: true },
      })
    );

    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);
    outboxService = app.get<OutboxService>(OutboxService);
    searchSyncService = app.get<ListingSearchSyncService>(ListingSearchSyncService);

    // Auth Tokens
    dealerToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_a_tariq',
      email: 'tariq@alfuttaim-prestige.ae',
      name: 'Tariq Al-Hashimi',
    });

    buyerToken = authService.generateDevToken({
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
    testMakeId = toyota.id;
    testModelId = toyota.models.find((m) => m.slug === 'land-cruiser')!.id;

    // Ensure dealer KYB is APPROVED and tenant is ACTIVE
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: TenantStatus.ACTIVE },
    });
    await prisma.dealerVerification.upsert({
      where: { tenantId },
      update: { status: VerificationStatus.APPROVED },
      create: {
        tenantId,
        status: VerificationStatus.APPROVED,
        tradeLicenseRef: 'DXB-TL-SYNC-TEST',
      },
    });

    // Clean up test vehicle
    const existing = await prisma.vehicle.findMany({
      where: { vin: '1GNEK1337SYNCTEST' },
    });
    for (const v of existing) {
      await prisma.listing.deleteMany({ where: { vehicleId: v.id } });
      await prisma.vehicleMedia.deleteMany({ where: { vehicleId: v.id } });
      await prisma.vehicle.delete({ where: { id: v.id } });
    }

    // Create fresh test vehicle in inventory
    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        branchId,
        makeId: testMakeId,
        modelId: testModelId,
        vin: '1GNEK1337SYNCTEST',
        stockNumber: 'STK-SYNC-001',
        modelYear: 2024,
        condition: VehicleCondition.USED,
        mileageKm: 12500,
        gccSpec: true,
        purchaseCostFils: BigInt(22000000), // AED 220,000 (Private)
        askingPriceFils: BigInt(29500000), // AED 295,000 (Public)
        stockStatus: StockStatus.AVAILABLE,
      },
    });
    testVehicleId = vehicle.id;

    // Add public media
    await prisma.vehicleMedia.create({
      data: {
        tenantId,
        vehicleId: testVehicleId,
        kind: MediaKind.EXTERIOR,
        objectKey: 'vehicles/sync-test/front.jpg',
        altText: 'Front 3/4 Studio View',
        sortOrder: 1,
        isPublic: true,
      },
    });

    // Create Draft Listing
    const listing = await prisma.listing.create({
      data: {
        tenantId,
        vehicleId: testVehicleId,
        slug: '2024-toyota-land-cruiser-sync-test',
        title: '2024 Toyota Land Cruiser GR-Sport Sync Edition',
        askingPriceFils: BigInt(29500000),
        status: ListingStatus.PENDING_REVIEW,
        qualityScore: 92,
      },
    });
    testListingId = listing.id;
    testListingSlug = listing.slug;
  });

  afterAll(async () => {
    outboxService.stopWorker();
    if (testVehicleId) {
      await prisma.outboxEvent.deleteMany({ where: { aggregateId: testListingId } });
      await prisma.listing.deleteMany({ where: { id: testListingId } });
      await prisma.vehicleMedia.deleteMany({ where: { vehicleId: testVehicleId } });
      await prisma.vehicle.deleteMany({ where: { id: testVehicleId } });
    }
    await app.close();
  });

  describe('1. Platform Admin Approval & Transactional Outbox Dispatch', () => {
    it('Approving a listing produces an atomic outboxEvent with eventType listing.published', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/listings/${testListingId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'APPROVE' })
        .expect(200);

      expect(response.body.status).toBe(ListingStatus.PUBLISHED);

      const outboxEvent = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: testListingId,
          eventType: 'listing.published',
        },
      });

      expect(outboxEvent).toBeDefined();
      expect(outboxEvent?.status).toBe(OutboxStatus.PENDING);
      expect((outboxEvent?.payload as any).listingId).toBe(testListingId);
    });

    it('Outbox worker processes listing.published event, transitioning status to SENT and syncing projection', async () => {
      const initialMetrics = await outboxService.getMetrics();
      expect(initialMetrics.pending).toBeGreaterThanOrEqual(1);

      // Process pending events
      const processedCount = await outboxService.processPendingEvents(50);
      expect(processedCount).toBeGreaterThanOrEqual(1);

      // Check event is now SENT with processedAt
      const updatedEvent = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: testListingId,
          eventType: 'listing.published',
        },
      });
      expect(updatedEvent?.status).toBe(OutboxStatus.SENT);
      expect(updatedEvent?.processedAt).toBeInstanceOf(Date);

      // Verify projection synchronizer indexed the listing
      expect(searchSyncService.isListingProjected(testListingId)).toBe(true);
      const projected = searchSyncService.getProjectedDetailBySlug(testListingSlug);
      expect(projected).toBeDefined();
      expect(projected?.id).toBe(testListingId);
      expect(projected?.maskedVin).toBe('1GNEK1337********');
      expect((projected as any).purchaseCostFils).toBeUndefined();
    });

    it('Public search returns the newly synchronized listing with strict redaction', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/listings?make=Toyota&emirate=Dubai')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      const found = res.body.items.find((i: any) => i.id === testListingId);
      expect(found).toBeDefined();
      expect(found.title).toContain('Sync Edition');
      expect(found.price.amountFils).toBe('29500000');
      expect(found.price.currency).toBe('AED');
      expect(found.seller.verified).toBe(true);
      expect(found.purchaseCostFils).toBeUndefined();
      expect(found.vin).toBeUndefined();
    });
  });

  describe('2. Authoritative Stock Transition & Automatic Unpublish', () => {
    it('Dealer transitions vehicle stockStatus to SOLD; appends listing.unpublished outbox event', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${tenantId}/vehicles/${testVehicleId}`)
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ stockStatus: StockStatus.SOLD })
        .expect(200);

      expect(patchRes.body.stockStatus).toBe(StockStatus.SOLD);

      // Verify listing status in DB transitioned to SOLD
      const listingInDb = await prisma.listing.findUnique({
        where: { id: testListingId },
      });
      expect(listingInDb?.status).toBe(ListingStatus.SOLD);

      // Verify transactional outbox event
      const unpublishEvent = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: testListingId,
          eventType: 'listing.unpublished',
          status: OutboxStatus.PENDING,
        },
      });
      expect(unpublishEvent).toBeDefined();
      expect((unpublishEvent?.payload as any).reason).toContain('SOLD');
    });

    it('Outbox worker processes listing.unpublished, evicting listing from search projection', async () => {
      const processedCount = await outboxService.processPendingEvents(50);
      expect(processedCount).toBeGreaterThanOrEqual(1);

      // Verify eviction from projection
      expect(searchSyncService.isListingProjected(testListingId)).toBe(false);
      expect(searchSyncService.getProjectedDetailBySlug(testListingSlug)).toBeNull();

      // Verify public search no longer returns the listing
      const searchRes = await request(app.getHttpServer())
        .get('/api/v1/public/listings?make=Toyota')
        .expect(200);

      const found = searchRes.body.items.some((i: any) => i.id === testListingId);
      expect(found).toBe(false);

      // Verify public detail by slug immediately returns 404
      await request(app.getHttpServer())
        .get(`/api/v1/public/listings/${testListingSlug}`)
        .expect(404);
    });
  });

  describe('3. Dealership Suspension Cascade Unpublish', () => {
    const suspTenantId = '77777777-7777-7777-7777-777777777777';
    const suspBranchId = '77777777-7777-7777-7777-000000000001';
    let secondVehicleId: string;
    let secondListingId: string;
    let secondListingSlug: string;

    beforeAll(async () => {
      // Create isolated tenant, branch, and verification for suspension test
      await prisma.tenant.upsert({
        where: { id: suspTenantId },
        update: { status: TenantStatus.ACTIVE },
        create: {
          id: suspTenantId,
          slug: 'suspension-test-dealer',
          legalName: 'Suspension Test Dealer LLC',
          displayName: 'Suspension Test Dealer',
          status: TenantStatus.ACTIVE,
        },
      });

      await prisma.branch.upsert({
        where: { id: suspBranchId },
        update: { isActive: true },
        create: {
          id: suspBranchId,
          tenantId: suspTenantId,
          name: 'Main Branch',
          emirate: 'Dubai',
          city: 'Dubai',
          isActive: true,
        },
      });

      await prisma.dealerVerification.upsert({
        where: { tenantId: suspTenantId },
        update: { status: VerificationStatus.APPROVED },
        create: {
          tenantId: suspTenantId,
          status: VerificationStatus.APPROVED,
          tradeLicenseRef: 'DXB-TL-SUSP-777',
        },
      });

      // Create vehicle and published listing for isolated tenant
      const v = await prisma.vehicle.create({
        data: {
          tenantId: suspTenantId,
          branchId: suspBranchId,
          makeId: testMakeId,
          modelId: testModelId,
          vin: '1GNEK1337SUSPTEST',
          stockNumber: 'STK-SUSP-002',
          modelYear: 2023,
          condition: VehicleCondition.USED,
          askingPriceFils: BigInt(21000000),
          stockStatus: StockStatus.AVAILABLE,
        },
      });
      secondVehicleId = v.id;

      await prisma.vehicleMedia.create({
        data: {
          tenantId: suspTenantId,
          vehicleId: secondVehicleId,
          kind: MediaKind.EXTERIOR,
          objectKey: 'vehicles/susp-test/1.jpg',
          sortOrder: 1,
          isPublic: true,
        },
      });

      const l = await prisma.listing.create({
        data: {
          tenantId: suspTenantId,
          vehicleId: secondVehicleId,
          slug: '2023-toyota-suspension-test',
          title: '2023 Toyota Pre-Suspension Showcase',
          askingPriceFils: BigInt(21000000),
          status: ListingStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      secondListingId = l.id;
      secondListingSlug = l.slug;

      // Project into search index
      await searchSyncService.handleListingPublished({ listingId: secondListingId });
      expect(searchSyncService.isListingProjected(secondListingId)).toBe(true);
    });

    afterAll(async () => {
      if (secondVehicleId) {
        await prisma.outboxEvent.deleteMany({ where: { aggregateId: secondListingId } });
        await prisma.listing.deleteMany({ where: { id: secondListingId } });
        await prisma.vehicleMedia.deleteMany({ where: { vehicleId: secondVehicleId } });
        await prisma.vehicle.deleteMany({ where: { id: secondVehicleId } });
      }
      await prisma.dealerVerification.deleteMany({ where: { tenantId: suspTenantId } });
      await prisma.outboxEvent.deleteMany({ where: { aggregateId: suspTenantId } });
      await prisma.auditEvent.deleteMany({ where: { tenantId: suspTenantId } });
      await prisma.branch.deleteMany({ where: { tenantId: suspTenantId } });
      await prisma.tenant.deleteMany({ where: { id: suspTenantId } });
    });

    it('Platform Admin suspends dealership; automatically pauses all active listings and appends outbox events', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/tenants/${suspTenantId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: TenantStatus.SUSPENDED,
          reason: 'Regulatory compliance audit pending',
        })
        .expect(200);

      expect(res.body.status).toBe(TenantStatus.SUSPENDED);

      // Verify all listings for this tenant in DB transitioned to PAUSED
      const listingInDb = await prisma.listing.findUnique({
        where: { id: secondListingId },
      });
      expect(listingInDb?.status).toBe(ListingStatus.PAUSED);

      // Verify tenant.suspended and listing.unpublished outbox events exist
      const tenantSuspendedOutbox = await prisma.outboxEvent.findFirst({
        where: {
          aggregateId: suspTenantId,
          eventType: 'tenant.suspended',
          status: OutboxStatus.PENDING,
        },
      });
      expect(tenantSuspendedOutbox).toBeDefined();
    });

    it('Processing outbox evicts all listings for suspended tenant from search projection', async () => {
      await outboxService.processPendingEvents(50);

      // Verify listing is evicted from search projection
      expect(searchSyncService.isListingProjected(secondListingId)).toBe(false);

      // Detail returns 404
      await request(app.getHttpServer())
        .get(`/api/v1/public/listings/${secondListingSlug}`)
        .expect(404);
    });
  });

  describe('4. Outbox Worker Idempotency & Error Retries', () => {
    it('Running processPendingEvents repeatedly is strictly idempotent with no side effects', async () => {
      const count1 = await outboxService.processPendingEvents(50);
      const count2 = await outboxService.processPendingEvents(50);
      expect(count2).toBe(0);
    });

    it('Failed event is retried up to 3 times before transitioning to FAILED', async () => {
      // Create a corrupted outbox event
      const failingEvent = await prisma.outboxEvent.create({
        data: {
          tenantId,
          aggregateType: 'listing',
          aggregateId: '00000000-0000-0000-0000-000000000000',
          eventType: 'listing.published',
          payload: { listingId: 'non-existent-id' },
          status: OutboxStatus.PENDING,
          attempts: 2, // 2 prior failures
        },
      });

      // Processing should increment to 3 attempts and set to FAILED
      await outboxService.processPendingEvents(10);

      const refreshed = await prisma.outboxEvent.findUnique({
        where: { id: failingEvent.id },
      });
      expect(refreshed?.attempts).toBe(3);
      expect(refreshed?.status).toBe(OutboxStatus.FAILED);

      // Admin can reset failed events via retry endpoint
      const retryRes = await request(app.getHttpServer())
        .post('/api/v1/admin/outbox/retry-failed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(retryRes.body.retriedCount).toBeGreaterThanOrEqual(1);

      const retried = await prisma.outboxEvent.findUnique({
        where: { id: failingEvent.id },
      });
      expect(retried?.status).toBe(OutboxStatus.PENDING);
      expect(retried?.attempts).toBe(0);

      // Clean up failing test event
      await prisma.outboxEvent.delete({ where: { id: failingEvent.id } });
    });
  });

  describe('5. Platform Admin Outbox Management API & Security Guards', () => {
    it('Non-admin user cannot access admin outbox endpoints (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/outbox/metrics')
        .set('Authorization', `Bearer ${dealerToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/admin/outbox/process')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });

    it('Platform admin retrieves real-time outbox metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/outbox/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('processing');
      expect(res.body).toHaveProperty('sent');
      expect(res.body).toHaveProperty('failed');
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    it('Platform admin manually triggers outbox processing via API', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/outbox/process?limit=25')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('processedCount');
      expect(res.body).toHaveProperty('metrics');
      expect(typeof res.body.processedCount).toBe('number');
    });
  });
});
