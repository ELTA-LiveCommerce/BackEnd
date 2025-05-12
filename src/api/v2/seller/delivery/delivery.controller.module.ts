import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryModule } from '@/module/delivery/delivery.module'; // DeliveryModule 경로 확인 및 주석 해제

@Module({
  imports: [DeliveryModule], // DeliveryModule import 추가
  controllers: [DeliveryController],
})
export class DeliveryControllerModule {}
