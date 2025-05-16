import { Module } from '@nestjs/common';
import { BroadcastController } from './broadcast.controller';
import { BroadcastModule } from '@/module/broadcast/broadcast.module';

@Module({
  imports: [BroadcastModule],
  controllers: [BroadcastController],
})
export class BroadcastControllerModule {}

