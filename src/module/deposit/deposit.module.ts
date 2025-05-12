import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Remove TypeORM import
import { MikroOrmModule } from '@mikro-orm/nestjs'; // Import MikroORM module

import { DepositService } from './deposit.service';
import { Order } from '@/module/order/entity/order.entity';
import { Product } from '../product/entity/product.entity'; // Needed for relation in OrderItem?
import { User } from '../user/entity/user.entity';
import { Delivery } from '../delivery/entity/delivery.entity'; // Needed for relation?
import { OrderItem } from '../order/entity/order-item.entity'; // Import OrderItem

@Module({
  imports: [
    MikroOrmModule.forFeature([Order, OrderItem, Product, User, Delivery]), // Use MikroOrmModule and include OrderItem
  ],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
