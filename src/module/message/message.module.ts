import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { MessageService } from './message.service';
import { Message } from './entity/message.entity';
import { Conversation } from './entity/conversation.entity';
import { UserModule } from '@/module/user/user.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Message, Conversation]),
    forwardRef(() => UserModule),
  ],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}