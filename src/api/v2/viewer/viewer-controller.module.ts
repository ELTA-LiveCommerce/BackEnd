import { Module } from '@nestjs/common';

import { SellerSearchControllerModule } from './seller-search/seller-search-controller.module';

@Module({
  imports: [SellerSearchControllerModule],
})
export class ViewerControllerModule {}
