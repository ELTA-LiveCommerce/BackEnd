import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { Product } from '@/module/product/entity/product.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

import { Order } from './order.entity';

@Entity({ tableName: 'order_items' })
export class OrderItem extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Order)
  order: Order;

  @ManyToOne(() => Product)
  product: Product;

  @Property()
  quantity: number;

  @Property()
  price: number;

  @Property()
  totalPrice: number;

  @Property({ nullable: true })
  attributes?: string;
}
