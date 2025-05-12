import { Controller, Get } from '@nestjs/common';

import { HealthService } from '@/module/health/health.service';

import { BaseResponseV2 } from '../common/base-response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('v2/health')
@Controller('v2/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  healthCheck() {
    const healthData = {
      ...this.healthService.check(),
      version: 'v2',
      timestamp: new Date().toISOString(),
    };

    return BaseResponseV2.success(healthData, '시스템 상태가 정상입니다.');
  }
}
