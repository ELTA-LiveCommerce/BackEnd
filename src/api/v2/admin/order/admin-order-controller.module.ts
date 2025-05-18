import { Module } from '@nestjs/common';
import { AdminOrderController } from './admin-order.controller';
import { OrderModule } from '@/module/order/order.module';
import { AuthModule } from '@/module/auth/auth.module';

@Module({
  imports: [OrderModule, AuthModule],
  controllers: [AdminOrderController],
})
export class AdminOrderControllerModule {}
