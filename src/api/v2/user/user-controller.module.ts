import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserModule } from '../../../module/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [UserController],
})
export class UserControllerModule {}

