import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module, forwardRef } from '@nestjs/common';

import { ProductModule } from '@/module/product/product.module'; // ProductService 등 필요 시
import { UserModule } from '@/module/user/user.module'; // UserService 등 필요 시
import { OrderModule } from '@/module/order/order.module'; // Order 관련 로직 필요

import { RefundEntity } from './entity/refund.entity';
import { RefundStatusHistoryEntity } from './entity/refund-status-history.entity';
import { RefundService } from './refund.service';
import { RefundStatusHistoryRepository } from './repository/refund-status-history.repository';

@Module({
  imports: [
    MikroOrmModule.forFeature([RefundEntity, RefundStatusHistoryEntity]),
    // 필요한 다른 모듈 import (예: ProductModule, UserModule)
    forwardRef(() => OrderModule), // 순환 의존성 방지를 위해 forwardRef 사용
    ProductModule,
    UserModule,
  ],
  providers: [RefundService, RefundStatusHistoryRepository],
  exports: [RefundService],
})
export class RefundModule {}

