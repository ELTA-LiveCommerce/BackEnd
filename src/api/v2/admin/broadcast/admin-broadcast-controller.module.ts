import { Module } from '@nestjs/common';
import { BroadcastModule } from '@/module/broadcast/broadcast.module';
import { UserModule } from '@/module/user/user.module';
import { AdminBroadcastController } from './admin-broadcast.controller';

@Module({
  imports: [BroadcastModule, UserModule],
  controllers: [AdminBroadcastController],
})
export class AdminBroadcastControllerModule {}
