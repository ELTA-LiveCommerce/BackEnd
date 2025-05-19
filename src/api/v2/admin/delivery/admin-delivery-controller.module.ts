import { Module } from '@nestjs/common';
import { DeliveryModule } from '@/module/delivery/delivery.module';
import { AdminDeliveryController } from './admin-delivery.controller';

@Module({
  imports: [DeliveryModule],
  controllers: [AdminDeliveryController],
})
export class AdminDeliveryControllerModule {}
