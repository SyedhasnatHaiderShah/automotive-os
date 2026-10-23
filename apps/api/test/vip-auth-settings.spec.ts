import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { ClientTier } from '../src/auth/dto/register-vip.dto';

describe('VIP Registration & Account Settings Suite (E2E Integration Tests)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;

  let testBuyerToken: string;
  let testUserId: string;

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

    // Clean up test identities to ensure test idempotency
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'mansoor.alketbi@sovereign-test.ae' },
          { identitySubject: 'uae_pass_784198849201941' },
        ],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. VIP Lead Intake & Registration (POST /api/v1/auth/register)', () => {
    it('should register a VIP Collector in pending state with NO authenticated JWT', async () => {
      const payload = {
        tier: ClientTier.COLLECTOR,
        legalName: 'Sheikh Mansoor Al-Ketbi',
        phone: '+971508924114',
        email: 'mansoor.alketbi@sovereign-test.ae',
        emiratesId: '784-1988-4920194-1',
        emirate: 'Dubai',
        marques: ['Ferrari', 'Porsche', 'Rolls-Royce'],
        consentPdpl: true,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.tier).toBe('collector');
      expect(res.body.email).toBe('mansoor.alketbi@sovereign-test.ae');
      expect(res.body.status).toBe('PENDING_VERIFICATION');
      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.accessToken).toBeUndefined();

      testUserId = res.body.userId;

      // Verify database record: Self-reported Emirates ID is NEVER trusted as UAE PASS identity
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId },
        include: { buyer: true },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.displayName).toBe('Sheikh Mansoor Al-Ketbi');
      expect(dbUser?.buyer?.preferredEmirate).toBe('Dubai');
      expect(dbUser?.buyer?.preferredMakes).toContain('Ferrari');
      expect(dbUser?.identitySubject).not.toMatch(/^uae_pass_/);
      expect(dbUser?.identitySubject).toMatch(/^pending_reg_/);

      // Negative Test: Unverified pending registration token CANNOT authenticate on protected resources
      const unverifiedToken = authService.generateDevToken({
        identitySubject: dbUser!.identitySubject,
        email: 'mansoor.alketbi@sovereign-test.ae',
        name: 'Sheikh Mansoor Al-Ketbi',
      });
      await request(app.getHttpServer())
        .get('/api/v1/me/settings')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(401);

      // Verified OIDC token activates session for subsequent settings tests
      testBuyerToken = authService.generateDevToken({
        identitySubject: 'auth0|verified_mansoor_alketbi',
        email: 'mansoor.alketbi@sovereign-test.ae',
        name: 'Sheikh Mansoor Al-Ketbi',
      });
      await prisma.user.update({
        where: { id: testUserId },
        data: { identitySubject: 'auth0|verified_mansoor_alketbi' },
      });
    });

    it('should reject registration when PDPL consent is missing or invalid', async () => {
      const payload = {
        tier: ClientTier.COLLECTOR,
        legalName: 'Unauthorized Collector',
        phone: '+971501234567',
        email: 'unauth@test.ae',
        consentPdpl: false,
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(400);
    });
  });

  describe('2. Account Settings & TRN/IBAN Persistence (GET & PATCH /api/v1/me/settings)', () => {
    it('should reject GET /api/v1/me/settings when unauthenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/me/settings')
        .expect(401);
    });

    it('should retrieve existing account settings for authenticated VIP client', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me/settings')
        .set('Authorization', `Bearer ${testBuyerToken}`)
        .expect(200);

      expect(res.body.userId).toBe(testUserId);
      expect(res.body.displayName).toBe('Sheikh Mansoor Al-Ketbi');
      expect(res.body.settlementCurrency).toBe('AED');
    });

    it('should update TRN, corporate affiliation, and FAB Escrow IBAN via PATCH /api/v1/me/settings', async () => {
      const updatePayload = {
        firstName: 'Mansoor',
        lastName: 'Al-Ketbi',
        handle: 'Mansoor.Collector.DXB',
        affiliation: 'Emirates Sovereign Holdings Ltd',
        trn: '100-2490-5829-0003',
        settlementCurrency: 'AED',
        escrowIban: 'AE02 0300 0019 2838 4810 992',
        garageVisibility: true,
        aecbRefresh: true,
        whatsappComms: true,
      };

      const res = await request(app.getHttpServer())
        .patch('/api/v1/me/settings')
        .set('Authorization', `Bearer ${testBuyerToken}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body.displayName).toBe('Mansoor.Collector.DXB');
      expect(res.body.affiliation).toBe('Emirates Sovereign Holdings Ltd');
      expect(res.body.trn).toBe('100-2490-5829-0003');
      expect(res.body.escrowIban).toBe('AE02 0300 0019 2838 4810 992');
      expect(res.body.garageVisibility).toBe(true);

      // Verify persistence via subsequent GET
      const getRes = await request(app.getHttpServer())
        .get('/api/v1/me/settings')
        .set('Authorization', `Bearer ${testBuyerToken}`)
        .expect(200);

      expect(getRes.body.trn).toBe('100-2490-5829-0003');
      expect(getRes.body.escrowIban).toBe('AE02 0300 0019 2838 4810 992');
      expect(getRes.body.affiliation).toBe('Emirates Sovereign Holdings Ltd');
    });
  });
});
