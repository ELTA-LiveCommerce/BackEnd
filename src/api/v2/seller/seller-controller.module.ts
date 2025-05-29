import { Module } from '@nestjs/common';

import { BlockControllerModule } from './block/block-controller.module';
import { DeliveryControllerModule } from './delivery/delivery.controller.module';
import { SellerProductControllerModule } from './product/product.controller.module';
import { RefundControllerModule } from './refund/refund-controller.module';
import { DepositControllerModule } from './deposit/deposit.controller.module';
import { BroadcastControllerModule } from './lives/broadcast-controller.module';
import { SellerUserControllerModule } from './users/seller-user-controller.module';
import { SellerMessageControllerModule } from './message/message-controller.module';

@Module({
  imports: [
    BlockControllerModule,
    DeliveryControllerModule,
    SellerProductControllerModule,
    RefundControllerModule,
    DepositControllerModule,
    BroadcastControllerModule,
    SellerUserControllerModule,
    SellerMessageControllerModule,
  ],
})
export class SellerControllerModule {}

