import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { Product } from '@/module/product/entity/product.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

@Entity({ tableName: 'order_items' })
export class OrderItem extends BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => Order)
  order: Order;

  @ManyToOne(() => Product)
  product: Product;

  @Property({ type: 'number' })
  quantity: number;

  @Property({ type: 'number' })
  price: number;

  @Property({ type: 'number' })
  totalPrice: number;

  @Property({ type: 'string', nullable: true })
  attributes?: string;

  constructor(order: Order, product: Product, quantity: number, price: number, attributes?: string) {
    super();
    this.order = order;
    this.product = product;
    this.quantity = quantity;
    this.price = price; // 주문 시점의 상품 가격
    this.totalPrice = price * quantity;
    if (attributes) this.attributes = attributes;
  }
}
