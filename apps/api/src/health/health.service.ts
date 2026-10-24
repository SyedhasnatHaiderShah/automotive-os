import { Injectable, Optional } from '@nestjs/common';
import { HealthStatusResponse } from '@automotive-os/contracts';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async getHealth(): Promise<HealthStatusResponse & { database?: string }> {
    let databaseStatus = 'unknown';
    if (this.prisma) {
      try {
        await this.prisma.$queryRaw`SELECT 1;`;
        databaseStatus = 'connected';
      } catch {
        databaseStatus = 'disconnected';
      }
    }

    return {
      status: databaseStatus === 'disconnected' ? 'degraded' : 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      details: {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage().rss,
      },
      database: databaseStatus,
    };
  }

  async getReadiness(): Promise<{ status: string; database: string }> {
    if (!this.prisma) {
      return { status: 'ready', database: 'skipped' };
    }
    await this.prisma.$queryRaw`SELECT 1;`;
    return { status: 'ready', database: 'connected' };
  }
}
