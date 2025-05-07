import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthService } from '../../module/health/health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return the result of the service check method', () => {
      const result = { status: 'ok', timestamp: '2023-01-01T00:00:00.000Z' };
      jest.spyOn(service, 'check').mockImplementation(() => result);

      expect(controller.healthCheck()).toBe(result);
      expect(service.check).toHaveBeenCalled();
    });
  });
});
