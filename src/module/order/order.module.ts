import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { Product } from '@/module/product/entity/product.entity';
import { ProductModule } from '@/module/product/product.module';
import { User } from '@/module/user/entity/user.entity';

import { OrderItem } from './entity/order-item.entity';
import { Order } from './entity/order.entity';
import { OrderService } from './order.service';

@Module({
  imports: [MikroOrmModule.forFeature([Order, OrderItem, Product, User]), ProductModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
