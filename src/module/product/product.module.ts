import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { UserModule } from '@/module/user/user.module';

import { BroadcastProduct } from './entity/broadcast-product.entity';
import { Product } from './entity/product.entity';
import { ProductService } from './product.service';

@Module({
  imports: [MikroOrmModule.forFeature([Product, BroadcastProduct]), UserModule],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
