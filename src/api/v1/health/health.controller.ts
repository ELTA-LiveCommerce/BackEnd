import { Controller, Get } from '@nestjs/common';

import { HealthService } from '../../../module/health/health.service';

@Controller('v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  healthCheck() {
    return this.healthService.check();
  }
}
