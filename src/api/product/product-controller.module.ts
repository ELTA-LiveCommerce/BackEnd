import { Module } from '@nestjs/common';

import { ProductModule } from '@/module/product/product.module';

import { ProductController } from './product.controller';

@Module({
  imports: [ProductModule],
  controllers: [ProductController],
})
export class ProductControllerModule {}
