import { Module } from '@nestjs/common';

import { BlockControllerModule } from './block/block-controller.module';
import { DeliveryControllerModule } from './delivery/delivery.controller.module';
import { SellerProductControllerModule } from './product/product.controller.module';
import { RefundControllerModule } from './refund/refund-controller.module';
import { DepositControllerModule } from './deposit/deposit.controller.module';

@Module({
  imports: [
    BlockControllerModule,
    DeliveryControllerModule,
    SellerProductControllerModule,
    RefundControllerModule,
    DepositControllerModule,
  ],
})
export class SellerControllerModule {}
