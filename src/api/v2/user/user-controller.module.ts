import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserModule } from '../../../module/user/user.module'; // Assuming UserModule exists and exports UserService
import { SellerInfoControllerModule } from './seller-info-controller.module';

@Module({
  imports: [UserModule, SellerInfoControllerModule],
  controllers: [UserController],
})
export class UserControllerModule {}

