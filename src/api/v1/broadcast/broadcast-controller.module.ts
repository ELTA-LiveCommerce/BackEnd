import { Module } from '@nestjs/common';

import { BroadcastModule } from '@/module/broadcast/broadcast.module'; // 서비스 모듈 import

import { BroadcastController } from './broadcast.controller';

@Module({
  imports: [BroadcastModule], // 서비스 모듈을 imports 배열에 추가
  controllers: [BroadcastController],
})
export class BroadcastControllerModule {}
