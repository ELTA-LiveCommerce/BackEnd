import { Module } from '@nestjs/common';

import { OrderModule } from '@/module/order/order.module';
import { ReturnRequestModule } from '@/module/order/return-request.module';

import { OrderController } from './order.controller';
import { ReturnRequestController } from './return-request.controller';

@Module({
  imports: [OrderModule, ReturnRequestModule],
  controllers: [OrderController, ReturnRequestController],
})
export class OrderControllerModule {}
