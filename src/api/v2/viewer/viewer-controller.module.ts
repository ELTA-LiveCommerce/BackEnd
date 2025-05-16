import { Module } from '@nestjs/common';

import { ProfileControllerModule } from './profile/profile-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';
import { ProductControllerModule } from './product/product-controller.module';
import { BroadcastControllerModule } from './live/broadcast-controller.module';

@Module({
  imports: [SellerControllerModule, ProfileControllerModule, ProductControllerModule, BroadcastControllerModule],
})
export class ViewerControllerModule {}
