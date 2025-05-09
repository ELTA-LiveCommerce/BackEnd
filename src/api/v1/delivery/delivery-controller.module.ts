import { Module } from '@nestjs/common';

import { DeliveryModule } from '@/module/delivery/delivery.module';

import { DeliveryController } from './delivery.controller';

@Module({
  imports: [DeliveryModule],
  controllers: [DeliveryController],
})
export class DeliveryControllerModule {}
