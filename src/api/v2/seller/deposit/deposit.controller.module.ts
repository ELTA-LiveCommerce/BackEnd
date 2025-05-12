import { Module } from '@nestjs/common';

import { DepositController } from './deposit.controller';
import { DepositModule } from '@/module/deposit/deposit.module';

@Module({
  imports: [DepositModule], // DepositModule 임포트
  controllers: [DepositController],
})
export class DepositControllerModule {}
