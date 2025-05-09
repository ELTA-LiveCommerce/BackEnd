import { Module } from '@nestjs/common';

import { UserModule } from '@/module/user/user.module';

import { UserAdminController } from './user-admin.controller';

@Module({
  imports: [UserModule],
  controllers: [UserAdminController],
})
export class AdminControllerModule {}
