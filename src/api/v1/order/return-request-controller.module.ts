import { Module } from '@nestjs/common';

import { ReturnRequestModule } from '@/module/order/return-request.module';

import { ReturnRequestController } from './return-request.controller';

@Module({
  imports: [ReturnRequestModule],
  controllers: [ReturnRequestController],
})
export class ReturnRequestControllerModule {}
