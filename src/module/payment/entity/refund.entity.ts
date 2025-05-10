import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { Order } from '@/module/order/entity/order.entity';
import { Payment } from '@/module/payment/entity/payment.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

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
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => Order, { fieldName: 'order_id' })
  order: Order;

  @ManyToOne(() => Payment, { fieldName: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => User, { fieldName: 'seller_id' })
  seller: User;

  @ManyToOne(() => User, { fieldName: 'requested_by_id' })
  requestedBy: User;

  @Enum({ items: () => RefundStatus, type: 'string' })
  status: RefundStatus = RefundStatus.REQUESTED;

  @Enum({ items: () => RefundReason, type: 'string' })
  reason: RefundReason;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string', nullable: true })
  rejectionReason?: string;

  @Property({ type: 'Date', nullable: true })
  completedAt?: Date;

  @Property({ type: 'Date', nullable: true })
  rejectedAt?: Date;
}
