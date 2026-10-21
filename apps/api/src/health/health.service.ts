import { Injectable } from '@nestjs/common';
import { HealthStatusResponse } from '@automotive-os/contracts';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  getHealth(): HealthStatusResponse {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      details: {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage().rss,
      },
    };
  }
}
