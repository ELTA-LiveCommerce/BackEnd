import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { HealthModule } from '../../module/health/health.module';

@Module({
  imports: [HealthModule],
  controllers: [HealthController],
})
export class HealthControllerModule {}
