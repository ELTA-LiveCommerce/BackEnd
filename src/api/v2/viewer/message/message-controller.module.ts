import { Module } from '@nestjs/common';

import { MessageController } from './message.controller';
import { MessageModule } from '@/module/message/message.module';

@Module({
  imports: [MessageModule],
  controllers: [MessageController],
})
export class MessageControllerModule {}