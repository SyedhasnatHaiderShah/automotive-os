import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService, runWithDbContext } from '../src/database/prisma.service';

describe('Security Hardening & Bypass Prevention Suite', () => {
  let app: INestApplication;
  let authService: AuthService;
  let prisma: PrismaService;

  let dealerAToken: string;
  let dealerBToken: string;
  let platformAdminToken: string;

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
      })
    );

    await app.init();

    authService = app.get<AuthService>(AuthService);
    prisma = app.get<PrismaService>(PrismaService);

    dealerAToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_a_tariq',
      email: 'tariq@alfuttaim-prestige.ae',
      name: 'Tariq Al-Hashimi',
    });

    dealerBToken = authService.generateDevToken({
      identitySubject: 'auth0|dealer_b_zayd',
      email: 'zayd@gargash-autos.ae',
      name: 'Zayd Al-Nuaimi',
    });

    platformAdminToken = authService.generateDevToken({
      identitySubject: 'auth0|platform_admin',
      email: 'admin@autonexa.ae',
      name: 'Maryam Al-Sabah',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Rejection of Fake 21-Character Admin Tokens', () => {
    it('rejects random 21+ char x-admin-token without authorization', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('x-admin-token', 'abcdefghijklmnopqrst1')
        .expect(401);
    });

    it('rejects random 21+ char cf-access-jwt-assertion header without valid signature', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('cf-access-jwt-assertion', '123456789012345678901234567890')
        .expect(401);
    });
  });

  describe('2. Rejection of Forged JWT Admin Claims', () => {
    it('rejects unsigned JWT token claiming isPlatformAdmin', async () => {
      const forgedPayload = Buffer.from(
        JSON.stringify({
          sub: 'auth0|attacker_1',
          email: 'attacker@evil.com',
          isPlatformAdmin: true,
          iss: 'https://auth.autonexa.ae',
          aud: 'autonexa-api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString('base64');
      const forgedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
      const forgedToken = `${forgedHeader}.${forgedPayload}.`;

      await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });

    it('rejects JWT signed with invalid secret claiming isPlatformAdmin', async () => {
      const forgedHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const forgedPayload = Buffer.from(
        JSON.stringify({
          sub: 'auth0|attacker_2',
          email: 'attacker2@evil.com',
          isPlatformAdmin: true,
          iss: 'https://auth.autonexa.ae',
          aud: 'autonexa-api',
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString('base64url');
      const forgedSig = Buffer.from('fake-signature-bytes').toString('base64url');
      const forgedToken = `${forgedHeader}.${forgedPayload}.${forgedSig}`;

      await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });
  });

  describe('3. Prevention of Tenant-Header Spoofing', () => {
    it('does not allow dealer A to access tenant B by setting x-tenant-id header', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantBId}/vehicles`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .set('x-tenant-id', tenantBId)
        .expect(403);
    });

    it('ignores x-tenant-id header on unauthenticated endpoints to prevent setting tenant context', async () => {
      // Calling public endpoint with x-tenant-id spoofing still returns public data without leaking private stock
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/listings')
        .set('x-tenant-id', tenantAId)
        .expect(200);

      // Verify no confidential fields leaked
      res.body.items.forEach((item: any) => {
        expect(item.purchaseCostFils).toBeUndefined();
        expect(item.internalNotes).toBeUndefined();
      });
    });
  });

  describe('4. SQL Injection Protection in Database Context & Parameterization', () => {
    it('rejects invalid UUID strings in tenant context with security error', async () => {
      const sqlInjectionString = "11111111-1111-1111-1111-111111111111'; DROP TABLE users; --";
      await expect(
        runWithDbContext({ tenantId: sqlInjectionString }, async () => {
          return prisma.vehicle.findMany();
        })
      ).rejects.toThrow(/\[SECURITY\] Invalid tenantId format in database context/);
    });

    it('rejects classic OR SQL injection string in tenant context', async () => {
      const orInjection = "' OR '1'='1' --";
      await expect(
        runWithDbContext({ tenantId: orInjection }, async () => {
          return prisma.vehicle.findMany();
        })
      ).rejects.toThrow(/\[SECURITY\] Invalid tenantId format in database context/);
    });
  });

  describe('5. Cross-Tenant Denial Verification', () => {
    it('denies Dealer A from accessing Dealer B vehicle inventory', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantBId}/vehicles`)
        .set('Authorization', `Bearer ${dealerAToken}`)
        .expect(403);
    });

    it('denies Dealer B from accessing Dealer A vehicle inventory', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tenants/${tenantAId}/vehicles`)
        .set('Authorization', `Bearer ${dealerBToken}`)
        .expect(403);
    });

    it('allows verified platform admin to inspect cross-tenant queues', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/tenants')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);
    });
  });
});
