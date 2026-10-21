import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class EnquiryRateLimiterService {
  private readonly windowMs = 60 * 1000; // 1 minute
  private readonly maxRequestsPerWindow = 5;
  private readonly requests = new Map<string, number[]>();

  /**
   * Check rate limit for a buyer identifier (userId or IP).
   * Throws 429 TOO_MANY_REQUESTS if limit exceeded.
   */
  checkLimit(key: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Filter timestamps within sliding window
    const recent = timestamps.filter((t) => now - t < this.windowMs);

    if (recent.length >= this.maxRequestsPerWindow) {
      throw new HttpException(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many enquiry requests. Please wait a moment before trying again.',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    recent.push(now);
    this.requests.set(key, recent);
  }

  /**
   * Clear rate limit for testing purposes.
   */
  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}
