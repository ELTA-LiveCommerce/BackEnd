import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';

import { HealthController } from './health.controller';
import { HealthService } from '@/module/health/health.service';
import { BaseResponseV2 } from '../common/base-response.dto';

describe('HealthControllerV2', () => {
  let controller: HealthController;
  let healthService: DeepMocked<HealthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: createMock<HealthService>(),
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return a success response with health data', () => {
      const serviceCheckResult = { status: 'ok', timestamp: 'mock-timestamp' };
      healthService.check.mockReturnValue(serviceCheckResult);

      const result = controller.healthCheck();

      expect(healthService.check).toHaveBeenCalled();
      expect(result).toBeInstanceOf(BaseResponseV2);
      expect(result.success).toBe(true);
      expect(result.message).toEqual('시스템 상태가 정상입니다.');
      expect(result.data).toBeDefined();
      expect(result.data.status).toEqual('ok');
      expect(result.data.version).toEqual('v2');
      expect(result.data.timestamp).toEqual(expect.any(String)); // controller에서 new Date()로 생성하므로 타입만 확인
      // healthService.check()의 timestamp는 controller에서 덮어쓰여짐
      // expect(result.data.timestamp).not.toEqual(serviceCheckResult.timestamp); // service의 timestamp와는 달라야 함
    });
  });
});
