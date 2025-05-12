import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductModule } from '@/module/product/product.module'; // 서비스 모듈 import

@Module({
  imports: [ProductModule], // ProductService를 사용하기 위해 ProductModule을 import
  controllers: [ProductController],
})
export class ProductControllerModule {}
