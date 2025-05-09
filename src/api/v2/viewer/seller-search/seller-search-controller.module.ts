import { Module } from '@nestjs/common';

import { UserModule } from '@/module/user/user.module';

import { SellerSearchController } from './seller-search.controller';

@Module({
  imports: [UserModule],
  controllers: [SellerSearchController],
})
export class SellerSearchControllerModule {}
