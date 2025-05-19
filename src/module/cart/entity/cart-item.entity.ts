import { Entity, ManyToOne, Property, Index } from '@mikro-orm/core';
import { BaseEntity } from '@/shared/entity/base.entity';
import { Product } from '@/module/product/entity/product.entity';

@Entity()
@Index({ properties: ['cart', 'product'] })
export class CartItem extends BaseEntity {
  @ManyToOne('Cart', { onDelete: 'CASCADE' })
  cart: any;

  @ManyToOne(() => Product)
  product: Product;

  @Property()
  quantity: number;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}

