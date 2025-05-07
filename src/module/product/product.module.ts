import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { BroadcastProduct } from './entity/broadcast-product.entity';
import { ProductAttribute } from './entity/product-attribute.entity';
import { Product } from './entity/product.entity';
import { ProductAttributeService } from './product-attribute.service';
import { ProductService } from './product.service';

@Module({
  imports: [MikroOrmModule.forFeature([Product, BroadcastProduct, ProductAttribute])],
  providers: [ProductService, ProductAttributeService],
  exports: [ProductService, ProductAttributeService],
})
export class ProductModule {}
