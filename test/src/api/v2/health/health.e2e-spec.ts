import { INestApplication } from '@nestjs/common';
import { createE2ETestingModule, testRequest } from '@test/helpers/e2e-test-utils';

import { HealthController } from '@/api/v2/health/health.controller';
import { HealthService } from '@/module/health/health.service';

describe('Health Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 모의 HealthService 생성
    const mockHealthService = {
      check: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    };

    // E2E 테스트 모듈 생성
    const { app: testApp } = await createE2ETestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    });

    app = testApp;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health (GET)', async () => {
    const response = await testRequest(app).get('/v2/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toBeDefined();
  });
});
