import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    const result = await controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.timestamp).toBeDefined();
  });

  it('should return readiness status', async () => {
    const result = await controller.getReadiness();
    expect(result.status).toBe('ready');
  });
});
