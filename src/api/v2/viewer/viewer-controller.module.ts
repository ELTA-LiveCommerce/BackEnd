import { Module } from '@nestjs/common';

import { ProfileControllerModule } from './profile/profile-controller.module';
import { SellerControllerModule } from './seller/seller-controller.module';

@Module({
  imports: [SellerControllerModule, ProfileControllerModule],
})
export class ViewerControllerModule {}
