import { Module, CacheModule } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';
import { CartService } from './cart.service';
import { Product } from '../product/entity/product.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([Cart, CartItem, Product]),
    CacheModule.register({
      ttl: 300, // 5분 캐시 유효 시간
      max: 100, // 최대 캐시 항목 수
    }),
  ],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

