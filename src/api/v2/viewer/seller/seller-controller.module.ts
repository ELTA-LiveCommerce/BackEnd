import { Module } from '@nestjs/common';

import { BroadcastModule } from '@/module/broadcast/broadcast.module';
import { ProductModule } from '@/module/product/product.module';
import { UserModule } from '@/module/user/user.module';

import { SellerController } from './seller.controller';

@Module({
  imports: [UserModule, BroadcastModule, ProductModule],
  controllers: [SellerController],
})
export class SellerControllerModule {}
