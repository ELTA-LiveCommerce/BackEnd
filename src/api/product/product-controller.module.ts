import { Module } from '@nestjs/common';

import { ProductModule } from '@/module/product/product.module';

import { ProductAttributeController } from './product-attribute.controller';
import { ProductController } from './product.controller';

@Module({
  imports: [ProductModule],
  controllers: [ProductController, ProductAttributeController],
})
export class ProductControllerModule {}
