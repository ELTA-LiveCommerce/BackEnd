import { Module } from '@nestjs/common';
import { DepositModule } from '@/module/deposit/deposit.module';
import { AdminDepositController } from './admin-deposit.controller';

@Module({
  imports: [DepositModule],
  controllers: [AdminDepositController],
})
export class AdminDepositControllerModule {}
