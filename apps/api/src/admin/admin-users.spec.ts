import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../listings/outbox.service';

describe('AdminService - User & Dealer Management', () => {
  let service: AdminService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockOutbox: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        updateMany: jest.fn(),
      },
      userInvitation: {
        create: jest.fn(),
      },
      auditEvent: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => callback(mockPrisma)),
    };

    mockAudit = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    };

    mockOutbox = {
      getMetrics: jest.fn(),
      processPendingEvents: jest.fn(),
      retryFailedEvents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: OutboxService, useValue: mockOutbox },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('listUsers', () => {
    it('should list and paginate users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'admin@autonexa.ae',
          displayName: 'Admin User',
          phoneE164: null,
          isPlatformAdmin: true,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerifiedAt: new Date(),
          memberships: [],
          buyer: null,
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.listUsers({ page: 1, limit: 10 }, 'admin-caller-id');
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.users[0].isPlatformAdmin).toBe(true);
      expect(mockAudit.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLATFORM_ADMIN_LIST_USERS' })
      );
    });
  });

  describe('updateUser & protection against disabling last admin', () => {
    it('should prevent disabling or demoting the last remaining active platform admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        isPlatformAdmin: true,
        status: 'ACTIVE',
      });
      // Zero other active admins
      mockPrisma.user.count.mockResolvedValue(0);

      await expect(
        service.updateUser('admin-1', { status: 'DISABLED' }, 'admin-1')
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateUser('admin-1', { isPlatformAdmin: false }, 'admin-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow demoting an admin if another active platform admin exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        isPlatformAdmin: true,
        status: 'ACTIVE',
      });
      // 1 other active admin exists
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.update.mockResolvedValue({
        id: 'admin-1',
        email: 'admin1@autonexa.ae',
        displayName: 'Admin 1',
        isPlatformAdmin: false,
        status: 'ACTIVE',
        updatedAt: new Date(),
      });

      const res = await service.updateUser('admin-1', { isPlatformAdmin: false }, 'admin-caller');
      expect(res.isPlatformAdmin).toBe(false);
    });
  });

  describe('revokeUserSessions', () => {
    it('should revoke all active sessions for a target user', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 3 });

      const res = await service.revokeUserSessions('user-123', 'admin-caller');
      expect(res.success).toBe(true);
      expect(res.revokedCount).toBe(3);
      expect(mockAudit.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLATFORM_ADMIN_REVOKE_SESSIONS' })
      );
    });
  });

  describe('createDealer', () => {
    it('should reject if dealership slug already exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant' });

      await expect(
        service.createDealer(
          {
            slug: 'al-futtaim',
            legalName: 'Al Futtaim',
            displayName: 'Al Futtaim Motors',
            adminEmail: 'principal@al-futtaim.ae',
            adminName: 'Principal',
          },
          'admin-caller'
        )
      ).rejects.toThrow(ConflictException);
    });

    it('should create dealership and provision initial owner', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue({
        id: 'tenant-1',
        slug: 'new-dealer',
        legalName: 'New Dealer LLC',
        displayName: 'New Dealer',
        status: 'ACTIVE',
        createdAt: new Date(),
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'dealer-admin-id',
        email: 'admin@newdealer.ae',
      });
      mockPrisma.membership = { create: jest.fn().mockResolvedValue({}) };
      mockPrisma.outboxEvent = { create: jest.fn().mockResolvedValue({}) };

      const res = await service.createDealer(
        {
          slug: 'new-dealer',
          legalName: 'New Dealer LLC',
          displayName: 'New Dealer',
          adminEmail: 'admin@newdealer.ae',
          adminName: 'Dealer Principal',
        },
        'admin-caller'
      );

      expect(res.slug).toBe('new-dealer');
      expect(res.status).toBe('ACTIVE');
    });
  });
});
