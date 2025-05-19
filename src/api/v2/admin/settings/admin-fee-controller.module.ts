import { Module } from '@nestjs/common';
import { UserModule } from '@/module/user/user.module';
import { AdminFeeController } from './admin-fee.controller';

@Module({
  imports: [UserModule],
  controllers: [AdminFeeController],
})
export class AdminFeeControllerModule {}
