import { Module } from '@nestjs/common';

import { ProductController } from './product.controller';
import { ProductModule } from '@/module/product/product.module';
import { AuthModule } from '@/module/auth/auth.module';

@Module({
  imports: [ProductModule, AuthModule],
  controllers: [ProductController],
})
export class V2SellerProductControllerModule {}
