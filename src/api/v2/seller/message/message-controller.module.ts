import { Module } from '@nestjs/common';

import { SellerMessageController } from './message.controller';
import { MessageModule } from '@/module/message/message.module';

@Module({
  imports: [MessageModule],
  controllers: [SellerMessageController],
})
export class SellerMessageControllerModule {}