import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Broadcast, Stream } from './entity/broadcast.entity';
import { BroadcastService } from './broadcast.service';
// Import related entities needed for repository injection
import { Product } from '@/module/product/entity/product.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { AgoraModule } from '../agora/agora.module';

@Module({
  // Register Broadcast, Product, and BroadcastProduct entities
  imports: [MikroOrmModule.forFeature([Broadcast, Product, BroadcastProduct, Stream]), AgoraModule],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
