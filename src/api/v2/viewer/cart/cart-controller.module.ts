import { Module } from '@nestjs/common';

import { CartController } from './cart.controller';
import { CartModule } from '@/module/cart/cart.module';
import { ProductModule } from '@/module/product/product.module';

@Module({
  imports: [CartModule, ProductModule],
  controllers: [CartController],
})
export class CartControllerModule {}
