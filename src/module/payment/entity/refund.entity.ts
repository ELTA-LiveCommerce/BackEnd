import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

import { Payment } from './payment.entity';

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  PRODUCT_DEFECT = 'PRODUCT_DEFECT',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  LATE_DELIVERY = 'LATE_DELIVERY',
  OTHER = 'OTHER',
}

@Entity()
export class Refund extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => Order, { fieldName: 'order_id' })
  order: Order;

  @ManyToOne(() => Payment, { fieldName: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => User, { fieldName: 'seller_id' })
  seller: User;

  @ManyToOne(() => User, { fieldName: 'requested_by_id' })
  requestedBy: User;

  @Enum(() => RefundStatus)
  status: RefundStatus = RefundStatus.REQUESTED;

  @Enum(() => RefundReason)
  reason: RefundReason;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ nullable: true })
  rejectionReason?: string;

  @Property({ nullable: true })
  completedAt?: Date;

  @Property({ nullable: true })
  rejectedAt?: Date;
}
