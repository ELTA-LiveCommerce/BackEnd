import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Broadcast } from './entity/broadcast.entity';
import { Stream } from './entity/stream.entity';
import { BroadcastService } from './broadcast.service';
// Import related entities needed for repository injection
import { Product } from '@/module/product/entity/product.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { AgoraModule } from '@/module/agora/agora.module';
import { UserModule } from '../user/user.module';
import { ViewLog } from './entity/view-log.entity';
import { PurchaseLog } from '../order/entity/purchase-log.entity';
import { LogService } from './log.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  // Register Broadcast, Product, and BroadcastProduct entities
  imports: [
    MikroOrmModule.forFeature([Broadcast, Product, BroadcastProduct, Stream, ViewLog, PurchaseLog]),
    UserModule,
    AgoraModule,
    NotificationModule,
  ],
  providers: [BroadcastService, LogService],
  exports: [BroadcastService, LogService],
})
export class BroadcastModule {}

