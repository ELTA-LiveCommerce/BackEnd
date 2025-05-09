import { Module } from '@nestjs/common';

import { SellerControllerModule } from './seller/seller-controller.module';

@Module({
  imports: [SellerControllerModule],
})
export class ViewerControllerModule {}
