import { Module } from '@nestjs/common';

import { ProfileControllerModule } from './profile/profile-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';
import { ProductControllerModule } from './product/product-controller.module';

@Module({
  imports: [SellerControllerModule, ProfileControllerModule, ProductControllerModule],
})
export class ViewerControllerModule {}
