import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService, resolveUserRedirect } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { hashPassword } from './password.util';
import { MembershipRole } from '@automotive-os/database';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: JwtService;

  const mockPrisma = {
    auditEvent: { create: jest.fn().mockResolvedValue({}) },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  describe('resolveUserRedirect', () => {
    it('should route suspended users to /access-suspended', () => {
      const res = resolveUserRedirect({
        isPlatformAdmin: false,
        status: 'SUSPENDED',
        memberships: [],
      });
      expect(res.redirectUrl).toBe('/access-suspended');
      expect(res.primaryRole).toBe('SUSPENDED');
    });

    it('should route disabled users to /access-denied', () => {
      const res = resolveUserRedirect({
        isPlatformAdmin: false,
        status: 'DISABLED',
        memberships: [],
      });
      expect(res.redirectUrl).toContain('/access-denied');
      expect(res.primaryRole).toBe('DISABLED');
    });

    it('should route platform admins to /admin', () => {
      const res = resolveUserRedirect({
        isPlatformAdmin: true,
        status: 'ACTIVE',
        memberships: [],
      });
      expect(res.redirectUrl).toBe('/admin');
      expect(res.primaryRole).toBe('PLATFORM_ADMIN');
    });

    it('should route active dealership staff to /dealer', () => {
      const res = resolveUserRedirect({
        isPlatformAdmin: false,
        status: 'ACTIVE',
        memberships: [
          {
            tenantId: 'tenant-123',
            role: 'ADMIN',
            active: true,
            tenantStatus: 'ACTIVE',
            tenantSlug: 'al-futtaim-motors',
          },
        ],
      });
      expect(res.redirectUrl).toBe('/dealer');
      expect(res.primaryRole).toBe('ADMIN');
      expect(res.tenantSlug).toBe('al-futtaim-motors');
    });

    it('should route dealer staff to /access-suspended if dealership is suspended', () => {
      const res = resolveUserRedirect({
        isPlatformAdmin: false,
        status: 'ACTIVE',
        memberships: [
          {
            tenantId: 'tenant-123',
            role: 'SALES_AGENT',
            active: true,
            tenantStatus: 'SUSPENDED',
            tenantSlug: 'al-futtaim-motors',
          },
        ],
      });
      expect(res.redirectUrl).toBe('/access-suspended?reason=tenant_suspended');
    });

    it('should route retail buyers to /account/garage', () => {
      const res = resolveUserRedirect({
        isPlatformAdmin: false,
        status: 'ACTIVE',
        memberships: [],
      });
      expect(res.redirectUrl).toBe('/account/garage');
      expect(res.primaryRole).toBe('BUYER');
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials and return JWT & user summary', async () => {
      const password = 'ValidPassword123!';
      const hash = await hashPassword(password);

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'buyer@autonexa.ae',
        displayName: 'Test Buyer',
        passwordHash: hash,
        identitySubject: 'email_buyer@autonexa.ae',
        isPlatformAdmin: false,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        memberships: [],
      });

      mockPrisma.session.create.mockResolvedValue({
        id: 'session-uuid-1',
      });

      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'buyer@autonexa.ae',
        password,
      });

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.redirectUrl).toBe('/account/garage');
      expect(mockPrisma.session.create).toHaveBeenCalled();
      expect(mockPrisma.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'AUTH_LOGIN_SUCCESS' }) }));
    });

    it('should reject invalid password and increment failed attempts', async () => {
      const hash = await hashPassword('CorrectPassword123!');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'buyer@autonexa.ae',
        passwordHash: hash,
        failedLoginAttempts: 2,
        lockedUntil: null,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        memberships: [],
      });

      mockPrisma.user.update.mockResolvedValueOnce({ failedLoginAttempts: 3 });

      await expect(
        service.login({ email: 'buyer@autonexa.ae', password: 'WrongPassword123!' })
      ).rejects.toThrow(UnauthorizedException);

      // Atomic increment (SEC-05) rather than read-modify-write.
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginAttempts: { increment: 1 } },
        })
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
        })
      );
    });

    it('should lock user out after 5 consecutive failed attempts', async () => {
      const hash = await hashPassword('CorrectPassword123!');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'buyer@autonexa.ae',
        passwordHash: hash,
        failedLoginAttempts: 4,
        lockedUntil: null,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        memberships: [],
      });

      mockPrisma.user.update.mockResolvedValueOnce({ failedLoginAttempts: 5 });

      await expect(
        service.login({ email: 'buyer@autonexa.ae', password: 'WrongPassword123!' })
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lockedUntil: expect.any(Date),
          }),
        })
      );
    });

    it('should not disclose account state before the password is verified', async () => {
      const hash = await hashPassword('CorrectPassword123!');
      mockPrisma.user.update.mockResolvedValueOnce({ failedLoginAttempts: 1 });
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'disabled@autonexa.ae',
        passwordHash: hash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'DISABLED',
        memberships: [],
      });

      await expect(
        service.login({ email: 'disabled@autonexa.ae', password: 'WrongPassword123!' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login for permanently disabled accounts', async () => {
      const hash = await hashPassword('CorrectPassword123!');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'disabled@autonexa.ae',
        passwordHash: hash,
        status: 'DISABLED',
        memberships: [],
      });

      await expect(
        service.login({ email: 'disabled@autonexa.ae', password: 'CorrectPassword123!' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('signupCustomer', () => {
    it('should reject registration if PDPL consent is missing', async () => {
      await expect(
        service.signupCustomer({
          email: 'newbuyer@autonexa.ae',
          password: 'Password123!@#',
          displayName: 'New Buyer',
          consentPdpl: false as any,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject weak passwords', async () => {
      await expect(
        service.signupCustomer({
          email: 'newbuyer@autonexa.ae',
          password: 'weak',
          displayName: 'New Buyer',
          consentPdpl: true,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent duplicate registration', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.signupCustomer({
          email: 'existing@autonexa.ae',
          password: 'ValidPassword123!',
          displayName: 'Existing Buyer',
          consentPdpl: true,
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register customer as unverified buyer', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newbuyer@autonexa.ae',
        status: 'PENDING_VERIFICATION',
        isPlatformAdmin: false,
      });

      const res = await service.signupCustomer({
        email: 'newbuyer@autonexa.ae',
        password: 'ValidPassword123!',
        displayName: 'New Buyer',
        consentPdpl: true,
        emirate: 'Dubai',
      });

      expect(res.success).toBe(true);
      expect(res.email).toBe('newbuyer@autonexa.ae');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPlatformAdmin: false,
            buyer: expect.any(Object),
          }),
        })
      );
    });
  });
});
