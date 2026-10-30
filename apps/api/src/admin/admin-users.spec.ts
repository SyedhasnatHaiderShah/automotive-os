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
      // AD-10: list/search reads no longer write an audit row per request.
      expect(mockAudit.logAction).not.toHaveBeenCalled();
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

  describe('self-action protection (AD-02)', () => {
    it('rejects suspending or disabling your own account when other admins exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        isPlatformAdmin: true,
        status: 'ACTIVE',
      });
      mockPrisma.user.count.mockResolvedValue(3);

      await expect(
        service.updateUser('admin-1', { status: 'SUSPENDED' }, 'admin-1')
      ).rejects.toThrow(/CANNOT_MODIFY_OWN_ACCOUNT/);
      await expect(
        service.updateUser('admin-1', { status: 'DISABLED' }, 'admin-1')
      ).rejects.toThrow(BadRequestException);
      await expect(service.deleteUser('admin-1', 'admin-1')).rejects.toThrow(
        /CANNOT_MODIFY_OWN_ACCOUNT/
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });

    it('rejects revoking your own sessions from the admin console', async () => {
      await expect(
        service.revokeUserSessions('admin-1', 'admin-1')
      ).rejects.toThrow(/CANNOT_REVOKE_OWN_SESSIONS/);
      expect(mockPrisma.session.updateMany).not.toHaveBeenCalled();
    });

    it('still allows an admin to suspend a different user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        isPlatformAdmin: false,
        status: 'ACTIVE',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-2',
        email: 'u2@example.com',
        displayName: 'User 2',
        isPlatformAdmin: false,
        status: 'SUSPENDED',
        updatedAt: new Date(),
      });
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.updateUser('user-2', { status: 'SUSPENDED' }, 'admin-1');
      expect(res.status).toBe('SUSPENDED');
    });
  });

  describe('updateTenantStatus transition rules (AD-04)', () => {
    const tenantRow = (status: string, verificationStatus?: string) => ({
      id: 'tenant-1',
      slug: 't1',
      legalName: 'T1 LLC',
      displayName: 'T1',
      status,
      createdAt: new Date(),
      verification: verificationStatus ? { status: verificationStatus } : null,
    });

    const mockUpdated = (status: string, verificationStatus = 'APPROVED') => {
      mockPrisma.tenant.update.mockResolvedValue({
        ...tenantRow(status, verificationStatus),
        _count: { memberships: 1, vehicles: 0 },
      });
    };

    beforeEach(() => {
      mockPrisma.listing = {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      };
      mockPrisma.outboxEvent = { create: jest.fn().mockResolvedValue({}) };
    });

    it('rejects any change from CLOSED (terminal)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantRow('CLOSED', 'APPROVED'));
      await expect(
        service.updateTenantStatus('admin-1', 'tenant-1', { status: 'ACTIVE' as any })
      ).rejects.toThrow(ConflictException);
      await expect(
        service.updateTenantStatus('admin-1', 'tenant-1', { status: 'SUSPENDED' as any })
      ).rejects.toThrow(/TENANT_CLOSED_TERMINAL/);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    });

    it('rejects PENDING -> ACTIVE unless KYB is APPROVED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantRow('PENDING', 'IN_REVIEW'));
      await expect(
        service.updateTenantStatus('admin-1', 'tenant-1', { status: 'ACTIVE' as any })
      ).rejects.toThrow(/TENANT_KYB_NOT_APPROVED/);

      mockPrisma.tenant.findUnique.mockResolvedValue(tenantRow('PENDING'));
      await expect(
        service.updateTenantStatus('admin-1', 'tenant-1', { status: 'ACTIVE' as any })
      ).rejects.toThrow(/NOT_SUBMITTED/);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    });

    it('allows PENDING -> ACTIVE when KYB is APPROVED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantRow('PENDING', 'APPROVED'));
      mockUpdated('ACTIVE');
      const res = await service.updateTenantStatus('admin-1', 'tenant-1', { status: 'ACTIVE' as any });
      expect(res.status).toBe('ACTIVE');
    });

    it('allows SUSPENDED -> ACTIVE reactivation and audits it', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantRow('SUSPENDED', 'APPROVED'));
      mockUpdated('ACTIVE');
      const res = await service.updateTenantStatus('admin-1', 'tenant-1', { status: 'ACTIVE' as any });
      expect(res.status).toBe('ACTIVE');
      expect(mockAudit.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PLATFORM_ADMIN_UPDATE_TENANT_STATUS' })
      );
    });

    it('allows ACTIVE -> SUSPENDED and rejects no-op or back-to-PENDING changes', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(tenantRow('ACTIVE', 'APPROVED'));
      mockUpdated('SUSPENDED');
      const res = await service.updateTenantStatus('admin-1', 'tenant-1', { status: 'SUSPENDED' as any });
      expect(res.status).toBe('SUSPENDED');

      await expect(
        service.updateTenantStatus('admin-1', 'tenant-1', { status: 'ACTIVE' as any })
      ).rejects.toThrow(/TENANT_STATUS_UNCHANGED/);
      await expect(
        service.updateTenantStatus('admin-1', 'tenant-1', { status: 'PENDING' as any })
      ).rejects.toThrow(/TENANT_STATUS_TRANSITION_INVALID/);
    });
  });

  describe('getTenantCounts (AD-09)', () => {
    it('returns exact counts by status and verification status without auditing', async () => {
      mockPrisma.tenant.count = jest.fn().mockResolvedValue(7);
      mockPrisma.tenant.groupBy = jest.fn().mockResolvedValue([
        { status: 'ACTIVE', _count: { _all: 5 } },
        { status: 'SUSPENDED', _count: { _all: 2 } },
      ]);
      mockPrisma.dealerVerification = {
        groupBy: jest.fn().mockResolvedValue([
          { status: 'APPROVED', _count: { _all: 4 } },
          { status: 'IN_REVIEW', _count: { _all: 1 } },
        ]),
      };

      const res = await service.getTenantCounts();
      expect(res.total).toBe(7);
      expect(res.byStatus).toEqual({ PENDING: 0, ACTIVE: 5, SUSPENDED: 2, CLOSED: 0 });
      expect(res.byVerificationStatus.APPROVED).toBe(4);
      expect(res.byVerificationStatus.IN_REVIEW).toBe(1);
      // 7 tenants, 5 verification rows: the 2 without a row are NOT_SUBMITTED.
      expect(res.byVerificationStatus.NOT_SUBMITTED).toBe(2);
      expect(mockAudit.logAction).not.toHaveBeenCalled();
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
