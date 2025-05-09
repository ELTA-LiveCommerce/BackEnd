import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';

export enum DeliveryStatus {
  PREPARING = 'PREPARING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

@Entity()
export class Delivery {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Order, { fieldName: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { fieldName: 'product_id' })
  product: Product;

  @ManyToOne(() => User, { fieldName: 'seller_id' })
  seller: User;

  @Enum(() => DeliveryStatus)
  status: DeliveryStatus = DeliveryStatus.PREPARING;

  @Property({ nullable: true })
  trackingNumber?: string;

  @Property({ nullable: true })
  courierCompany?: string;

  @Property()
  shippingAddress: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  shippedAt?: Date;

  @Property({ nullable: true })
  deliveredAt?: Date;

  @Property({ nullable: true })
  canceledAt?: Date;
}
