import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRateLimitGuard, AUTH_RATE_LIMIT_KEY } from './auth-rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  let guard: AuthRateLimitGuard;
  let reflector: Reflector;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    AuthRateLimitGuard.reset();
    reflector = new Reflector();
    guard = new AuthRateLimitGuard(reflector);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  function createMockContext(options: {
    ip?: string;
    handlerName?: string;
    className?: string;
    limitOptions?: { limit: number; windowMs: number };
  }): { context: ExecutionContext; setHeaderMock: jest.Mock } {
    const setHeaderMock = jest.fn();
    const handler = () => {};
    const controllerClass = class TestController {};

    if (options.handlerName) {
      Object.defineProperty(handler, 'name', { value: options.handlerName });
    }
    if (options.className) {
      Object.defineProperty(controllerClass, 'name', { value: options.className });
    }

    if (options.limitOptions) {
      jest.spyOn(reflector, 'get').mockImplementation((key) => {
        if (key === AUTH_RATE_LIMIT_KEY) {
          return options.limitOptions;
        }
        return undefined;
      });
    } else {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          ip: options.ip || '192.168.1.1',
          socket: { remoteAddress: options.ip || '192.168.1.1' },
        }),
        getResponse: () => ({
          setHeader: setHeaderMock,
        }),
      }),
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as unknown as ExecutionContext;

    return { context, setHeaderMock };
  }

  it('bypasses rate limit checks when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    const { context } = createMockContext({
      limitOptions: { limit: 1, windowMs: 60_000 },
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests when no rate limit options are configured on handler', () => {
    const { context } = createMockContext({ limitOptions: undefined });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows requests up to the configured limit and blocks subsequent requests with 429', () => {
    const { context, setHeaderMock } = createMockContext({
      limitOptions: { limit: 2, windowMs: 60_000 },
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);

    let error: HttpException | null = null;
    try {
      guard.canActivate(context);
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeInstanceOf(HttpException);
    expect(error?.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error?.getResponse()).toEqual({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts. Please wait and try again.',
    });
    expect(setHeaderMock).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('isolates buckets by client IP address', () => {
    const { context: contextClientA } = createMockContext({
      ip: '10.0.0.1',
      limitOptions: { limit: 1, windowMs: 60_000 },
    });
    const { context: contextClientB } = createMockContext({
      ip: '10.0.0.2',
      limitOptions: { limit: 1, windowMs: 60_000 },
    });

    expect(guard.canActivate(contextClientA)).toBe(true);
    expect(() => guard.canActivate(contextClientA)).toThrow(HttpException);

    // Client B must still have quota
    expect(guard.canActivate(contextClientB)).toBe(true);
    expect(() => guard.canActivate(contextClientB)).toThrow(HttpException);
  });
});
