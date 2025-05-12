import { Module } from '@nestjs/common';

import { BlockControllerModule } from './block/block-controller.module';
import { DeliveryControllerModule } from './delivery/delivery.controller.module';
import { SellerProductControllerModule } from './product/product.controller.module';

@Module({
  imports: [BlockControllerModule, DeliveryControllerModule, SellerProductControllerModule],
})
export class SellerControllerModule {}
