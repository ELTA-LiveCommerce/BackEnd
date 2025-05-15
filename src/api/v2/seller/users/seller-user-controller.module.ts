import { Module } from '@nestjs/common';
import { UserModule } from '@/module/user/user.module';
import { SellerUserController } from './seller-user.controller';

@Module({
  imports: [UserModule], // UserService를 사용하기 위해 UserModule import
  controllers: [SellerUserController],
})
export class SellerUserControllerModule {}
