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
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => Order, { fieldName: 'order_id' })
  order: Order;

  @ManyToOne(() => User, { fieldName: 'seller_id' })
  seller: User;

  @Enum({ items: () => PaymentStatus, type: 'string' })
  status: PaymentStatus = PaymentStatus.PENDING;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Property({ type: 'string', nullable: true })
  transactionId?: string;

  @Property({ type: 'string', nullable: true })
  paymentMethod?: string;

  @Property({ type: 'string', nullable: true })
  notes?: string;

  @Property({ type: 'Date', nullable: true })
  completedAt?: Date;

  @Property({ type: 'Date', nullable: true })
  canceledAt?: Date;

  @Property({ type: 'Date', nullable: true })
  refundedAt?: Date;
}
