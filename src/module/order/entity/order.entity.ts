import { Collection, Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { OrderStatus } from '@/shared/enum/order-status.enum';

import { OrderItem } from './order-item.entity';

@Entity({ tableName: 'orders' })
export class Order extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @ManyToOne(() => User)
  user: User;

  @Property()
  orderNumber: string;

  @Enum(() => OrderStatus)
  status: OrderStatus = OrderStatus.PENDING;

  @OneToMany(() => OrderItem, (item) => item.order, { eager: true, orphanRemoval: true })
  items = new Collection<OrderItem>(this);

  @Property()
  totalAmount: number;

  @Property({ nullable: true })
  paymentMethod?: string;

  @Property({ nullable: true })
  paymentId?: string;

  @Property({ nullable: true })
  shippingAddress?: string;

  @Property({ nullable: true })
  shippingCode?: string;

  @Property({ nullable: true })
  cancelReason?: string;

  @Property({ nullable: true })
  refundReason?: string;

  @Property({ nullable: true })
  notes?: string;

  @Property({ nullable: true })
  paidAt?: Date;

  @Property({ nullable: true })
  shippedAt?: Date;

  @Property({ nullable: true })
  deliveredAt?: Date;

  @Property({ nullable: true })
  cancelledAt?: Date;

  @Property({ nullable: true })
  refundedAt?: Date;
}
