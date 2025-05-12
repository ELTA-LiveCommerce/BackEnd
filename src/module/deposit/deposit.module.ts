import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm'; // Remove TypeORM import
import { MikroOrmModule } from '@mikro-orm/nestjs'; // Import MikroORM module
import { Order } from '../order/entity/order.entity';
import { DepositService } from './deposit.service';
import { OrderItem } from '../order/entity/order-item.entity';
import { OrderModule } from '../order/order.module'; // Import OrderModule

import { Product } from '../product/entity/product.entity'; // Needed for relation in OrderItem?
import { User } from '../user/entity/user.entity';
import { Delivery } from '../delivery/entity/delivery.entity'; // Needed for relation?

@Module({
  imports: [
    MikroOrmModule.forFeature([Order, OrderItem, Product, User, Delivery]), // Use MikroOrmModule and include OrderItem
    OrderModule, // Add OrderModule to imports
  ],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
