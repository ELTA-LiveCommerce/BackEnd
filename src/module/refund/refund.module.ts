import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { ProductModule } from '@/module/product/product.module'; // ProductService 등 필요 시
import { UserModule } from '@/module/user/user.module'; // UserService 등 필요 시
// import { OrderModule } from '@/module/order/order.module'; // Order 관련 로직 필요 시

import { Refund } from './entity/refund.entity';
import { RefundService } from './refund.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Refund]),
    // 필요한 다른 모듈 import (예: ProductModule, UserModule)
    // OrderModule, // 주석 처리: 실제 Order 엔티티/모듈 구현 후 활성화 필요
    ProductModule,
    UserModule,
  ],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
