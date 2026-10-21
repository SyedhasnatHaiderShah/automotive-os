import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantAccessGuard } from './tenant-access.guard';
import { MembershipRole } from '@automotive-os/database';

describe('TenantAccessGuard', () => {
  let guard: TenantAccessGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantAccessGuard(reflector);
  });

  const createMockContext = (user: any, params: any, handlerRoles?: MembershipRole[]): ExecutionContext => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(handlerRoles);

    const request = {
      user,
      params,
      tenantContext: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should allow platform admin bypass for any tenant', () => {
    const user = {
      id: 'admin-uuid',
      isPlatformAdmin: true,
      memberships: [],
    };
    const context = createMockContext(user, { tenantId: 'tenant-any-uuid' });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.tenantContext.isPlatformAdminBypass).toBe(true);
  });

  it('should allow access to active dealer member with correct tenant', () => {
    const user = {
      id: 'dealer-uuid',
      isPlatformAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-a-uuid',
          tenantSlug: 'dealer-a',
          tenantName: 'Dealer A',
          tenantStatus: 'ACTIVE',
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
      ],
    };
    const context = createMockContext(user, { tenantId: 'tenant-a-uuid' });

    const result = guard.canActivate(context);
    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.tenantContext.tenantId).toBe('tenant-a-uuid');
    expect(req.tenantContext.userRole).toBe(MembershipRole.SALES_AGENT);
  });

  it('should deny access if user has no membership in requested tenant (Cross-Tenant Denial)', () => {
    const user = {
      id: 'dealer-a-uuid',
      isPlatformAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-a-uuid',
          tenantStatus: 'ACTIVE',
          role: MembershipRole.OWNER,
          active: true,
        },
      ],
    };
    // Attempting to access Tenant B
    const context = createMockContext(user, { tenantId: 'tenant-b-uuid' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access if user membership is inactive', () => {
    const user = {
      id: 'deactivated-staff-uuid',
      isPlatformAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-a-uuid',
          tenantStatus: 'ACTIVE',
          role: MembershipRole.SALES_AGENT,
          active: false, // Inactive staff
        },
      ],
    };
    const context = createMockContext(user, { tenantId: 'tenant-a-uuid' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access if tenant is suspended', () => {
    const user = {
      id: 'staff-uuid',
      isPlatformAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-a-uuid',
          tenantStatus: 'SUSPENDED',
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
      ],
    };
    const context = createMockContext(user, { tenantId: 'tenant-a-uuid' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should enforce role permissions when required roles are defined', () => {
    const user = {
      id: 'sales-agent-uuid',
      isPlatformAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-a-uuid',
          tenantStatus: 'ACTIVE',
          role: MembershipRole.SALES_AGENT,
          active: true,
        },
      ],
    };
    // Route requires OWNER or ADMIN
    const context = createMockContext(
      user,
      { tenantId: 'tenant-a-uuid' },
      [MembershipRole.OWNER, MembershipRole.ADMIN]
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should grant access when user has one of the required roles', () => {
    const user = {
      id: 'owner-uuid',
      isPlatformAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-a-uuid',
          tenantStatus: 'ACTIVE',
          role: MembershipRole.OWNER,
          active: true,
        },
      ],
    };
    const context = createMockContext(
      user,
      { tenantId: 'tenant-a-uuid' },
      [MembershipRole.OWNER, MembershipRole.ADMIN]
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw BadRequestException if tenantId parameter is absent', () => {
    const user = { id: 'user-uuid', isPlatformAdmin: false, memberships: [] };
    const context = createMockContext(user, {});

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });
});
