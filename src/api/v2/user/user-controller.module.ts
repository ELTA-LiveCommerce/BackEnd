import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserModule } from '../../../module/user/user.module'; // Assuming UserModule exists and exports UserService

@Module({
  imports: [UserModule], // Import UserModule to make UserService available
  controllers: [UserController],
})
export class UserControllerModule {}
