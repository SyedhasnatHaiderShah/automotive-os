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
    const context = createMockContext({ id: 'admin-uuid', isPlatformAdmin: true });
    expect(guard.canActivate(context)).toBe(true);
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
