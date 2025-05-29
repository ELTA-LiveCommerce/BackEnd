import { Module } from '@nestjs/common';

import { ProfileControllerModule } from './profile/profile-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';
import { ProductControllerModule } from './product/product-controller.module';
import { BroadcastControllerModule } from './live/broadcast-controller.module';
import { OrderControllerModule } from './order/order-controller.module';
import { CartControllerModule } from './cart/cart-controller.module';
import { MessageControllerModule } from './message/message-controller.module';

@Module({
  imports: [
    BroadcastControllerModule,
    CartControllerModule,
    MessageControllerModule,
    OrderControllerModule,
    ProductControllerModule,
    ProfileControllerModule,
    SellerControllerModule,
  ],
})
export class ViewerControllerModule {}

