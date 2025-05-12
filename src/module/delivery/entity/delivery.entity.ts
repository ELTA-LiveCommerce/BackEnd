import { Entity, ManyToOne, Property, PrimaryKey } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { User } from '@/module/user/entity/user.entity';

export enum DeliveryStatus {
  PREPARING = 'PREPARING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

@Entity()
export class Delivery {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => Order)
  order: Order;

  @ManyToOne(() => User)
  seller: User;

  @Property({ type: 'string' })
  status: DeliveryStatus = DeliveryStatus.PREPARING;

  @Property({ type: 'string', nullable: true })
  trackingNumber?: string;

  @Property({ type: 'string', nullable: true })
  courierCompany?: string;

  @Property({ type: 'string' })
  recipientName: string;

  @Property({ type: 'string' })
  recipientPhoneNumber: string;

  @Property({ type: 'string' })
  address: string;

  @Property({ type: 'Date', nullable: true })
  shippedAt?: Date;

  @Property({ type: 'Date', nullable: true })
  deliveredAt?: Date;

  @Property({ type: 'Date', nullable: true })
  canceledAt?: Date;

  @Property({ type: 'Date' })
  createdAt: Date = new Date();

  @Property({ type: 'Date', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
