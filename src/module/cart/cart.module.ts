import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { CartService } from './cart.service';
import { Product } from '../product/entity/product.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Cart, CartItem, Product])],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

