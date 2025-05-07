import { Controller, Get } from '@nestjs/common';

import { HealthService } from '../../module/health/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  healthCheck() {
    return this.healthService.check();
  }
}
