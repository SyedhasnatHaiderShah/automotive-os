import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth & Tenancy Module (Integration / E2E Authorization Tests)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;

  let buyerAToken: string;
  let dealerAToken: string;
  let dealerBToken: string;
  let adminToken: string;

  const tenantAId = '11111111-1111-1111-1111-111111111111';
  const tenantBId = '22222222-2222-2222-2222-222222222222';

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
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);

    // Mint valid OIDC test tokens for seeded personas
    buyerAToken = authService.generateDevToken({
      identitySubject: 'auth0|buyer_a_rashid',
      email: 'rashid.buyer@example.ae',
      name: 'Rashid Al-Maktoum',
    });

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

    adminToken = authService.generateDevToken({
      identitySubject: 'auth0|platform_admin',
      email: 'admin@autonexa.ae',
      name: 'Maryam Al-Sabah',
    });
  });

  beforeEach(async () => {
    // Reset Buyer A profile before tests for state isolation
    const buyerUser = await prisma.user.findUnique({
      where: { identitySubject: 'auth0|buyer_a_rashid' },
    });
    if (buyerUser) {
      await prisma.buyerProfile.upsert({
        where: { userId: buyerUser.id },
        update: {
          preferredLanguage: 'ar',
          preferredEmirate: 'Dubai',
          budgetMinFils: BigInt(20000000),
          budgetMaxFils: BigInt(40000000),
        },
        create: {
          userId: buyerUser.id,
          preferredLanguage: 'ar',
          preferredEmirate: 'Dubai',
          budgetMinFils: BigInt(20000000),
          budgetMaxFils: BigInt(40000000),
        },
      });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------------------------------------
  // 1. Health Endpoint (Public)
  // -------------------------------------------------------------
  describe('GET /health', () => {
    it('should be publicly accessible without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('api');
    });
  });

  // -------------------------------------------------------------
  // 2. Global Buyer Identity & Authentication
  // -------------------------------------------------------------
  describe('Global Buyer Identity (/api/v1/me)', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should return global buyer identity summary with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${buyerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.identitySubject).toBe('auth0|buyer_a_rashid');
      expect(res.body.displayName).toBe('Rashid Al-Maktoum');
      expect(res.body.isPlatformAdmin).toBe(false);
      expect(res.body.buyerProfile).toBeDefined();
      expect(res.body.buyerProfile.preferredLanguage).toBe('ar');
    });

    it('should get own buyer profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me/buyer-profile')
        .set('Authorization', `Bearer ${buyerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.preferredEmirate).toBe('Dubai');
    });

    it('should reject update with invalid DTO data (negative budget) with 400', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/me/buyer-profile')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          budgetMinFils: -100, // Invalid negative integer
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.details).toBeDefined();
    });

    it('should update own buyer profile with valid data', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/me/buyer-profile')
        .set('Authorization', `Bearer ${buyerAToken}`)
        .send({
          preferredLanguage: 'en',
          preferredEmirate: 'Abu Dhabi',
          budgetMinFils: 25000000,
          budgetMaxFils: 50000000,
        });

      expect(res.status).toBe(200);
      expect(res.body.preferredLanguage).toBe('en');
      expect(res.body.preferredEmirate).toBe('Abu Dhabi');
      expect(res.body.budgetMinFils).toBe('25000000');
    });
  });

  // -------------------------------------------------------------
  // 3. Tenancy Access & Cross-Tenant Denial Tests
  // -------------------------------------------------------------
  describe('Dealer Tenancy & Access Boundary (/api/v1/tenants/:tenantId)', () => {
    it('should allow Dealer A member to access Dealer A context', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/context`)
        .set('Authorization', `Bearer ${dealerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tenantId).toBe(tenantAId);
      expect(res.body.callerRole).toBe('OWNER');
      expect(res.body.branches).toHaveLength(1);
    });

    it('NEGATIVE: should deny Dealer A member from accessing Dealer B tenant (Cross-Tenant Denial)', async () => {
      // Dealer A principal tries to query Dealer B's endpoint
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantBId}/context`)
        .set('Authorization', `Bearer ${dealerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('TENANT_FORBIDDEN');
    });

    it('NEGATIVE: should deny Buyer from accessing Dealer A tenant', async () => {
      // Buyer A tries to access Dealer A's endpoint
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/context`)
        .set('Authorization', `Bearer ${buyerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('TENANT_FORBIDDEN');
    });

    it('should grant access to privileged management route when user holds OWNER role', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/privileged-management`)
        .set('Authorization', `Bearer ${dealerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('authorized');
    });

    it('should allow Platform Admin audited bypass access to Dealer A tenant', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/context`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isPlatformAdminBypass).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 4. Platform Admin Separation & Audit Logging
  // -------------------------------------------------------------
  describe('Platform Admin Separation (/api/v1/admin/tenants)', () => {
    it('NEGATIVE: should deny Buyer from accessing platform admin endpoints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('Authorization', `Bearer ${buyerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('PLATFORM_ADMIN_REQUIRED');
    });

    it('NEGATIVE: should deny Dealer member from accessing platform admin endpoints', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('Authorization', `Bearer ${dealerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('PLATFORM_ADMIN_REQUIRED');
    });

    it('POSITIVE: should allow Platform Admin to list all dealerships without writing a list-read audit row', async () => {
      const correlationId = `corr-test-${Date.now()}`;

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-correlation-id', correlationId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // List reads are no longer audited (AD-10); mutations and single-record reads still are.
      const auditLog = await prisma.auditEvent.findFirst({
        where: { correlationId },
      });

      expect(auditLog).toBeNull();
    });
  });
});
