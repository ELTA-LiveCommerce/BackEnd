import { Module } from '@nestjs/common';

import { HealthControllerModule } from './health/health-controller.module';
import { ViewerControllerModule } from './viewer/viewer-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';

@Module({
  imports: [HealthControllerModule, ViewerControllerModule, SellerControllerModule],
})
export class V2ControllerModule {}
