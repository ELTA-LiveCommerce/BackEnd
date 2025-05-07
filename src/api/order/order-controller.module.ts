import { Module } from '@nestjs/common';

import { OrderModule } from '@/module/order/order.module';

import { OrderController } from './order.controller';

@Module({
  imports: [OrderModule],
  controllers: [OrderController],
})
export class OrderControllerModule {}
