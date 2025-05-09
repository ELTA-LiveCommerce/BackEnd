import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

@Entity()
export class Payment extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Order, { fieldName: 'order_id' })
  order: Order;

  @ManyToOne(() => User, { fieldName: 'seller_id' })
  seller: User;

  @Enum(() => PaymentStatus)
  status: PaymentStatus = PaymentStatus.PENDING;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Property({ nullable: true })
  transactionId?: string;

  @Property({ nullable: true })
  paymentMethod?: string;

  @Property({ nullable: true })
  notes?: string;

  @Property({ nullable: true })
  completedAt?: Date;

  @Property({ nullable: true })
  canceledAt?: Date;

  @Property({ nullable: true })
  refundedAt?: Date;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
