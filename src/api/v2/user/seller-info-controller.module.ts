import { Module } from '@nestjs/common';

import { SellerInfoController } from './seller-info.controller';
import { UserModule } from '@/module/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [SellerInfoController],
})
export class SellerInfoControllerModule {}
