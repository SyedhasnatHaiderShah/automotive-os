import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthStatusResponse } from '@automotive-os/contracts';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): HealthStatusResponse {
    return this.healthService.getHealth();
  }
}
