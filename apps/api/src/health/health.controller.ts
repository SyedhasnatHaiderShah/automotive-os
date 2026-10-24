import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthStatusResponse } from '@automotive-os/contracts';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthStatusResponse> {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async getReadiness(): Promise<{ status: string; database: string }> {
    try {
      return await this.healthService.getReadiness();
    } catch (err: any) {
      throw new ServiceUnavailableException({
        status: 'unready',
        database: 'disconnected',
        error: err.message,
      });
    }
  }
}
