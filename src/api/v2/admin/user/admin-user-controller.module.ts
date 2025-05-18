import { Module } from '@nestjs/common';
import { UserModule } from '@/module/user/user.module';
import { AdminUserController } from './admin-user.controller';

@Module({
  imports: [UserModule],
  controllers: [AdminUserController],
})
export class AdminUserControllerModule {}

