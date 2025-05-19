import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '@/module/user/entity/user.entity';
import { Product } from '@/module/product/entity/product.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Order } from '@/module/order/entity/order.entity';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Product, Broadcast, Order])],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
