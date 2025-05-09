import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { BroadcastService } from './broadcast.service';
import { Broadcast } from './entity/broadcast.entity';
import { BroadcastProduct } from '../product/entity/broadcast-product.entity';
import { Product } from '../product/entity/product.entity';
// import { UserModule } from '@/module/user/user.module'; // UserService 사용 시 필요

@Module({
  imports: [
    MikroOrmModule.forFeature([Broadcast, BroadcastProduct, Product]),
    // UserModule, // UserService 사용 시 필요
  ],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
