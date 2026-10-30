import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const AUTH_RATE_LIMIT_KEY = 'authRateLimit';

export interface AuthRateLimitOptions {
  /** Max requests per window for one client IP on this route. */
  limit: number;
  windowMs: number;
}

/** Applies a per-IP fixed-window limit to an unauthenticated auth route (SEC-06). */
export const AuthRateLimit = (options: AuthRateLimitOptions) =>
  SetMetadata(AUTH_RATE_LIMIT_KEY, options);

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Process-local limiter. It bounds brute force and enumeration per instance;
 * a shared store (Redis) is still needed for horizontal scaling.
 */
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private static readonly buckets = new Map<string, Bucket>();
  private static lastSweep = 0;

  constructor(private readonly reflector: Reflector) {}

  static reset(): void {
    AuthRateLimitGuard.buckets.clear();
  }

  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'test') return true;

    const options = this.reflector.get<AuthRateLimitOptions | undefined>(
      AUTH_RATE_LIMIT_KEY,
      context.getHandler()
    );
    if (!options) return true;

    const req = context.switchToHttp().getRequest();
    const ip: string = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${context.getClass().name}.${context.getHandler().name}:${ip}`;
    const now = Date.now();

    this.sweep(now);

    const bucket = AuthRateLimitGuard.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      AuthRateLimitGuard.buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    bucket.count += 1;
    if (bucket.count > options.limit) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      context.switchToHttp().getResponse()?.setHeader?.('Retry-After', String(retryAfterSeconds));
      throw new HttpException(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many attempts. Please wait and try again.' },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    return true;
  }

  /** Drops expired buckets at most once a minute so memory stays bounded. */
  private sweep(now: number): void {
    if (now - AuthRateLimitGuard.lastSweep < 60_000) return;
    AuthRateLimitGuard.lastSweep = now;
    for (const [key, bucket] of AuthRateLimitGuard.buckets) {
      if (bucket.resetAt <= now) AuthRateLimitGuard.buckets.delete(key);
    }
  }
}
