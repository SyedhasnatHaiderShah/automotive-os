import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  let guard: AuthRateLimitGuard;
  let reflector: Reflector;

  beforeEach(() => {
    AuthRateLimitGuard.reset();
    reflector = new Reflector();
    guard = new AuthRateLimitGuard(reflector);
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  function createMockContext(ip: string, handlerName: string): ExecutionContext {
    const mockRequest = {
      ip,
      socket: { remoteAddress: ip },
    };
    const mockResponse = {
      setHeader: jest.fn(),
    };
    const handler = { name: handlerName };
    const classType = { name: 'AuthController' };

    return {
      getHandler: () => handler,
      getClass: () => classType,
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  }

  it('allows requests within limit and enforces rate limit when exceeded', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ limit: 2, windowMs: 60_000 });
    const context = createMockContext('1.2.3.4', 'verifyActivationToken');

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.getResponse()).toEqual({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many attempts. Please wait and try again.',
      });
    }
  });

  it('tracks different IPs separately', () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ limit: 1, windowMs: 60_000 });
    const context1 = createMockContext('1.1.1.1', 'verifyActivationToken');
    const context2 = createMockContext('2.2.2.2', 'verifyActivationToken');

    expect(guard.canActivate(context1)).toBe(true);
    expect(guard.canActivate(context2)).toBe(true);
    expect(() => guard.canActivate(context1)).toThrow(HttpException);
  });
});
