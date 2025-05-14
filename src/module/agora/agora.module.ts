// src/agora/agora.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgoraService } from './agora.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [AgoraService],
  exports: [AgoraService],
})
export class AgoraModule {}
