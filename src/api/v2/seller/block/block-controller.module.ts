import { Module } from '@nestjs/common';
import { UserModule } from '@/module/user/user.module'; // UserBlockService를 포함하는 UserModule
import { BlockController } from './block.controller';

@Module({
  imports: [UserModule], // UserBlockService를 사용하기 위해 UserModule 임포트
  controllers: [BlockController],
})
export class BlockControllerModule {}
