import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { hashPassword } from '../src/auth/password.util';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('CF-07 Unified Authentication, RBAC & Platform Administration E2E Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let platformAdminToken: string;
  let platformAdminId: string;
  let dealerStaffToken: string;
  let dealerStaffId: string;
  let buyerToken: string;
  let buyerId: string;
  let testTenantId: string;

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

  describe('1. Customer Self-Registration (/api/v1/auth/signup)', () => {
    const testEmail = `cf07_buyer_${Date.now()}@autonexa.ae`;

    it('should reject registration if PDPL consent agreement is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!@#',
          displayName: 'Test Buyer',
          consentPdpl: false,
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error?.message)).toContain('PDPL');
    });

    it('should reject weak password complying with complexity policy', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'weak',
          displayName: 'Test Buyer',
          consentPdpl: true,
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.error?.message)).toContain('at least 10 characters');
    });

    it('should successfully register retail customer buyer with isPlatformAdmin=false', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!@#',
          displayName: 'Rashid Al Nuaimi',
          emirate: 'Abu Dhabi',
          consentPdpl: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.email).toBe(testEmail);
      buyerId = res.body.userId;

      // Verify database record
      const dbUser = await prisma.user.findUnique({
        where: { id: buyerId },
        include: { buyer: true },
      });
      expect(dbUser?.isPlatformAdmin).toBe(false);
      expect(dbUser?.buyer).not.toBeNull();
      expect(dbUser?.buyer?.preferredEmirate).toBe('Abu Dhabi');
    });

    it('should prevent duplicate registration with same email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'SecurePass123!@#',
          displayName: 'Duplicate Buyer',
          consentPdpl: true,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('2. Unified Login (/api/v1/auth/login)', () => {
    it('should authenticate platform admin, return role redirect to /admin, and set ao_session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_admin@autonexa.ae',
          password: 'AdminPass123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.isPlatformAdmin).toBe(true);
      expect(res.body.user.primaryRole).toBe('PLATFORM_ADMIN');
      expect(res.body.user.redirectUrl).toBe('/admin');

      // Check cookie header
      const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c: string) => c.startsWith('ao_session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');

      platformAdminToken = res.body.accessToken;
    });

    it('should authenticate dealership staff and return role redirect to /dealer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_staff@dealership.ae',
          password: 'StaffPass123!@#',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.primaryRole).toBe('SALES_MANAGER');
      expect(res.body.user.redirectUrl).toBe('/dealer');

      dealerStaffToken = res.body.accessToken;
    });

    it('should reject incorrect password and increment failed attempts', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'cf07_staff@dealership.ae',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error?.message).toContain('Invalid email or password');
    });
  });

  describe('3. Cookie-Based Introspection & Dashboard Resolver (/api/v1/auth/me)', () => {
    it('should authenticate via HTTP-only cookie ao_session without Bearer header', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', `ao_session=${platformAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(platformAdminId);
      expect(res.body.isPlatformAdmin).toBe(true);
      expect(res.body.resolvedDashboardUrl).toBe('/admin');
    });

    it('should authenticate dealer staff and return memberships', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${dealerStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isPlatformAdmin).toBe(false);
      expect(res.body.memberships).toHaveLength(1);
      expect(res.body.memberships[0].role).toBe('SALES_MANAGER');
      expect(res.body.resolvedDashboardUrl).toBe('/dealer');
    });
  });

  describe('4. Platform Administration Role Gates & User Management', () => {
    it('should reject non-admin access to /api/v1/admin/users with 403 PLATFORM_ADMIN_REQUIRED', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${dealerStaffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.message).toContain('PLATFORM_ADMIN_REQUIRED');
    });

    it('should allow platform admin to list users with pagination and search', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users?page=1&limit=20')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should allow platform admin to suspend and reactivate a user', async () => {
      // Suspend
      const suspendRes = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${dealerStaffId}`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ status: 'SUSPENDED' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.status).toBe('SUSPENDED');

      // Reactivate
      const reactivateRes = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${dealerStaffId}`)
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({ status: 'ACTIVE' });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.status).toBe('ACTIVE');
    });

    it('should prevent disabling the last remaining active platform admin', async () => {
      // Find other active admins
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

    it('should allow platform admin to provision new dealership tenant', async () => {
      const newSlug = `dealer-cf07-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/dealers')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          slug: newSlug,
          legalName: 'E2E Provisioned Motors LLC',
          displayName: 'E2E Provisioned Motors',
          adminEmail: `owner_${Date.now()}@provisioned.ae`,
          adminName: 'Owner Principal',
        });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe(newSlug);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('should allow platform admin to stream audit logs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs?limit=10')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('5. Logout & Session Termination (/api/v1/auth/logout)', () => {
    it('should logout, revoke session and clear ao_session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${platformAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c: string) => c.startsWith('ao_session=;'));
      expect(clearedCookie).toBeDefined();
    });
  });
});
