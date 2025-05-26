import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductModule } from '@/module/product/product.module'; // 서비스 모듈 import
import { DeliveryModule } from '@/module/delivery/delivery.module'; // DeliveryService를 사용하기 위해 DeliveryModule을 import

@Module({
  imports: [ProductModule, DeliveryModule], // DeliveryModule 추가
  controllers: [ProductController],
})
export class ProductControllerModule {}

