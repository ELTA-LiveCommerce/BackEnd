import { Entity, ManyToOne, Enum, Property, PrimaryKey } from '@mikro-orm/core';
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

  @ManyToOne(() => Order)
  order: Order;

  @ManyToOne(() => Product, { nullable: true })
  product?: Product;

  @ManyToOne(() => User)
  seller: User;

  @Enum(() => DeliveryStatus)
  status: DeliveryStatus = DeliveryStatus.PREPARING;

  @Property({ nullable: true })
  trackingNumber?: string;

  @Property({ nullable: true })
  courierCompany?: string;

  @Property({ nullable: true })
  shippingAddress?: string;

  @Property({ nullable: true })
  shippedAt?: Date;

  @Property({ nullable: true })
  deliveredAt?: Date;

  @Property({ nullable: true })
  canceledAt?: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
