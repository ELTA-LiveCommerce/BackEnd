import { Test, TestingModule } from '@nestjs/testing';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return status ok', () => {
      const result = service.check();
      expect(result.status).toEqual('ok');
    });

    it('should return a timestamp', () => {
      const result = service.check();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
