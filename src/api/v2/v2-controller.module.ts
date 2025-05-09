import { Module } from '@nestjs/common';

import { HealthControllerModule } from './health/health-controller.module';
import { ViewerControllerModule } from './viewer/viewer-controller.module';

@Module({
  imports: [HealthControllerModule, ViewerControllerModule],
})
export class V2ControllerModule {}
