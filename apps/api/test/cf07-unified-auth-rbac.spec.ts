import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { hashPassword } from '../src/auth/password.util';
import { generateTotpCode } from '../src/auth/totp.util';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { randomBytes, createHash } from 'node:crypto';

describe('CF-07 Unified Authentication, RBAC & Security Remediation (S1-S4) E2E Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let platformAdminToken: string;
  let platformAdminId: string;
  let dealerStaffToken: string;
  let dealerStaffId: string;
  let testTenantId: string;

  let customerEmail: string;
  let customerRawToken: string;
  let customerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Seed test platform admin
    const adminPasswordHash = await hashPassword('AdminPass123!@#');
    const adminUser = await prisma.user.upsert({
      where: { identitySubject: 'test_platform_admin_cf07' },
      update: {
        isPlatformAdmin: true,
        status: 'ACTIVE',
        passwordHash: adminPasswordHash,
        emailVerifiedAt: new Date(),
      },
      create: {
        identitySubject: 'test_platform_admin_cf07',
        email: 'cf07_admin@autonexa.ae',
        displayName: 'CF-07 Platform Admin',
        isPlatformAdmin: true,
        status: 'ACTIVE',
        passwordHash: adminPasswordHash,
        emailVerifiedAt: new Date(),
      },
    });
    platformAdminId = adminUser.id;

    // Seed test tenant & dealer staff
    const testTenant = await prisma.tenant.upsert({
      where: { slug: 'cf07-test-dealership' },
      update: { status: 'ACTIVE' },
      create: {
        slug: 'cf07-test-dealership',
        legalName: 'CF07 Test Dealership LLC',
        displayName: 'CF07 Test Motors',
        status: 'ACTIVE',
      },
    });
    testTenantId = testTenant.id;

    const staffPasswordHash = await hashPassword('StaffPass123!@#');
    const staffUser = await prisma.user.upsert({
      where: { identitySubject: 'test_dealer_staff_cf07' },
      update: {
        status: 'ACTIVE',
        passwordHash: staffPasswordHash,
        emailVerifiedAt: new Date(),
      },
      create: {
        identitySubject: 'test_dealer_staff_cf07',
        email: 'cf07_staff@dealership.ae',
        displayName: 'CF07 Sales Manager',
        isPlatformAdmin: false,
        status: 'ACTIVE',
        passwordHash: staffPasswordHash,
        emailVerifiedAt: new Date(),
      },
    });
    dealerStaffId = staffUser.id;

    await prisma.membership.upsert({
      where: {
        tenantId_userId: {
          tenantId: testTenantId,
          userId: dealerStaffId,
        },
      },
      update: { active: true, role: 'SALES_MANAGER' },
      create: {
        tenantId: testTenantId,
        userId: dealerStaffId,
        role: 'SALES_MANAGER',
        active: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Customer Self-Registration & Email Verification (S1)', () => {
    customerEmail = `cf07_buyer_${Date.now()}@autonexa.ae`;

    it('should reject registration if PDPL consent agreement is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: customerEmail,
          password: 'SecurePass123!@#',
          displayName: 'Test Buyer',
          consentPdpl: false,
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error?.message)).toContain('PDPL');
    });

    it('should reject registration if role or admin injection is attempted in body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: `injected_${Date.now()}@autonexa.ae`,
          password: 'SecurePass123!@#',
          displayName: 'Hacker Buyer',
          consentPdpl: true,
          isPlatformAdmin: true, // Should be rejected by ValidationPipe
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error?.message)).toContain('should not exist');
    });

    it('should register unverified customer identity with PENDING_VERIFICATION and emailVerifiedAt=null', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: customerEmail,
          password: 'SecurePass123!@#',
          displayName: 'Rashid Al Nuaimi',
          emirate: 'Abu Dhabi',
          consentPdpl: true,
          consentMarketing: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('PENDING_VERIFICATION');
      expect(res.body.verificationToken).toBeDefined();

      customerRawToken = res.body.verificationToken;
      customerUserId = res.body.userId;

      // Check database state
      const dbUser = await prisma.user.findUnique({
        where: { id: customerUserId },
        include: { buyer: true },
      });

      expect(dbUser?.emailVerifiedAt).toBeNull();
      expect(dbUser?.status).toBe('PENDING_VERIFICATION');
      expect(dbUser?.emailVerificationTokenHash).toBeDefined();
      expect(dbUser?.buyer?.pdplConsentAt).not.toBeNull();
      expect(dbUser?.buyer?.marketingConsentAt).toBeNull();
    });

    it('should prevent unverified customer from logging in (403 EMAIL_NOT_VERIFIED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail,
          password: 'SecurePass123!@#',
        });

      expect(res.status).toBe(403);
      expect(res.body.error?.message).toContain('EMAIL_NOT_VERIFIED');
    });

    it('should reject email verification with invalid or tampered token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid_token_12345' });

      expect(res.status).toBe(400);
      expect(res.body.error?.message).toContain('Invalid or already used');
    });

    it('should successfully verify customer email with valid token and activate account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: customerRawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbUser = await prisma.user.findUnique({ where: { id: customerUserId } });
      expect(dbUser?.status).toBe('ACTIVE');
      expect(dbUser?.emailVerifiedAt).not.toBeNull();
      expect(dbUser?.emailVerificationTokenHash).toBeNull();
    });

    it('should allow customer login after email verification', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: customerEmail,
          password: 'SecurePass123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.status).toBe('ACTIVE');
      expect(res.body.user.redirectUrl).toBe('/account/garage');
    });

    it('should handle resend-verification safely without leaking user existence', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'nonexistent@autonexa.ae' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an unverified account exists');
    });
  });

  describe('2. Administrator Invitation & Password-Only Activation (S2)', () => {
    let activationToken: string;
    let adminInvitationEmail: string;

    it('provisions a pending identity without premature platform admin elevation', async () => {
      adminInvitationEmail = `bootstrap_admin_${Date.now()}@autonexa.ae`;
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const targetUser = await prisma.user.create({
        data: {
          identitySubject: `email_${adminInvitationEmail}`,
          email: adminInvitationEmail,
          displayName: 'Pending Admin',
          isPlatformAdmin: false,
          status: 'PENDING_VERIFICATION',
        },
      });
      await prisma.userInvitation.create({
        data: {
          email: adminInvitationEmail,
          tokenHash,
          isPlatformAdmin: true,
          invitedUserId: targetUser.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      activationToken = rawToken;
      expect(targetUser.isPlatformAdmin).toBe(false);
    });

    it('verifies invitation metadata without an MFA enrollment secret', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/auth/activate/verify?token=${activationToken}`);
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.email).toBe(adminInvitationEmail);
      expect(res.body.isPlatformAdmin).toBe(true);
      expect(res.body.requiresMfa).toBe(false);
      expect(res.body.mfaSecret).toBeUndefined();
    });

    it('rejects activation using an incorrect invitation token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/activate/complete')
        .send({ token: randomBytes(32).toString('hex'), password: 'NewAdminPassword123!@#' });
      expect(res.status).toBe(400);
    });

    it('completes activation using invitation and strong password only', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/activate/complete')
        .send({ token: activationToken, password: 'NewAdminPassword123!@#' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const activatedUser = await prisma.user.findFirst({ where: { email: adminInvitationEmail } });
      expect(activatedUser?.isPlatformAdmin).toBe(true);
      expect(activatedUser?.status).toBe('ACTIVE');
      expect(activatedUser?.mfaEnabled).toBe(false);
      expect(activatedUser?.mfaSecret).toBeNull();
    });

    it('rejects reuse of an accepted invitation', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/activate/complete')
        .send({ token: activationToken, password: 'AnotherPassword123!' });
      expect(res.status).toBe(400);
      expect(res.body.error?.message).toContain('already accepted');
    });
  });

  describe('3. Unified Login & Dynamic Role Resolver', () => {
    it('should authenticate platform admin and return redirect to /admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_admin@autonexa.ae',
          password: 'AdminPass123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.isPlatformAdmin).toBe(true);
      expect(res.body.user.redirectUrl).toBe('/admin');

      platformAdminToken = res.body.accessToken;
    });

    it('should authenticate dealer staff and return role-specific redirect to /dealer/crm', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_staff@dealership.ae',
          password: 'StaffPass123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.primaryRole).toBe('SALES_MANAGER');
      expect(res.body.user.redirectUrl).toBe('/dealer/crm');

      dealerStaffToken = res.body.accessToken;
    });
  });

  describe('4. Authoritative Session Invalidation & State Enforcement (S3)', () => {
    it('should deny access immediately when an active user is suspended', async () => {
      // Suspend dealer staff
      await prisma.user.update({
        where: { id: dealerStaffId },
        data: { status: 'SUSPENDED' },
      });

      // Attempt to access /api/v1/auth/me with existing token
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${dealerStaffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.message).toContain('ACCOUNT_SUSPENDED');

      // Restore user status for subsequent tests
      await prisma.user.update({
        where: { id: dealerStaffId },
        data: { status: 'ACTIVE' },
      });
    });

    it('should deny access immediately when sessions are revoked in PostgreSQL', async () => {
      // Log in to create a session
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_staff@dealership.ae',
          password: 'StaffPass123!@#',
        });

      const activeToken = loginRes.body.accessToken;

      // Access should work
      const beforeRevoke = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);
      expect(beforeRevoke.status).toBe(200);

      // Admin revokes all sessions for dealer staff
      const revokeRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${dealerStaffId}/revoke-sessions`)
        .set('Authorization', `Bearer ${platformAdminToken}`);
      expect(revokeRes.status).toBe(200);

      // Subsequent access with the token MUST immediately fail (401 SESSION_REVOKED)
      const afterRevoke = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(afterRevoke.status).toBe(401);
      expect(afterRevoke.body.error?.message).toContain('SESSION_REVOKED');
    });

    it('should verify admin session authoritatively at /api/v1/auth/verify-admin-session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/verify-admin-session')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });

    it('should reject verify-admin-session for non-platform admins', async () => {
      // Relogin dealer staff
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_staff@dealership.ae',
          password: 'StaffPass123!@#',
        });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/verify-admin-session')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.message).toContain('PLATFORM_ADMIN_REQUIRED');
    });
  });

  describe('5. Platform Admin User Governance & Last Admin Protection', () => {
    it('should reject non-admin access to /api/v1/admin/users', async () => {
      // Relogin dealer staff
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_staff@dealership.ae',
          password: 'StaffPass123!@#',
        });

      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(403);
    });

    it('should prevent disabling or deleting the last active platform admin', async () => {
      const otherAdmins = await prisma.user.findMany({
        where: { isPlatformAdmin: true, id: { not: platformAdminId } },
      });

      try {
        await prisma.user.updateMany({
          where: { isPlatformAdmin: true, id: { not: platformAdminId } },
          data: { status: 'DISABLED' },
        });

        const res = await request(app.getHttpServer())
          .patch(`/api/v1/admin/users/${platformAdminId}`)
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({ status: 'DISABLED' });

        expect(res.status).toBe(400);
        expect(res.body.error?.message).toContain('CANNOT_DISABLE_LAST_PLATFORM_ADMIN');
      } finally {
        if (otherAdmins.length > 0) {
          await prisma.user.updateMany({
            where: { id: { in: otherAdmins.map((a) => a.id) } },
            data: { status: 'ACTIVE' },
          });
        }
      }
    });
  });

  describe('6. Security Audit Defect Checks (S4)', () => {
    it('should fail closed on dev token endpoint if ALLOW_DEV_TOKENS is not true', async () => {
      const prevEnv = process.env.ALLOW_DEV_TOKENS;
      delete process.env.ALLOW_DEV_TOKENS;

      try {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/token')
          .send({ identitySubject: 'test_sub' });

        expect(res.status).toBe(403);
      } finally {
        if (prevEnv) process.env.ALLOW_DEV_TOKENS = prevEnv;
      }
    });
  });
});
