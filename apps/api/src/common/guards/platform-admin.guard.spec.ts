import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlatformAdminGuard } from './platform-admin.guard';

describe('PlatformAdminGuard', () => {
  let guard: PlatformAdminGuard;

  beforeEach(() => {
    guard = new PlatformAdminGuard();
  });

  const createMockContext = (user: any): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access to platform admin user', () => {
    const context = createMockContext({ id: 'admin-uuid', isPlatformAdmin: true, status: 'ACTIVE' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny a platform admin whose account is not ACTIVE (QA-LOCAL-06)', () => {
    for (const status of ['SUSPENDED', 'DISABLED', 'PENDING_VERIFICATION']) {
      const context = createMockContext({ id: 'admin-uuid', isPlatformAdmin: true, status });
      expect(() => guard.canActivate(context)).toThrow(/PLATFORM_ADMIN_INACTIVE/);
    }
  });

  it('should deny access to regular user', () => {
    const context = createMockContext({ id: 'user-uuid', isPlatformAdmin: false });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access if user is missing', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
