import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';

import { BaseEntity } from '@/shared/entity/base.entity';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { User } from '@/module/user/entity/user.entity';
import { RefundEntity } from './refund.entity';

@Entity({ tableName: 'refund_status_histories' })
export class RefundStatusHistoryEntity extends BaseEntity {
  @ManyToOne(() => RefundEntity)
  refund: RefundEntity;

  @Enum(() => RefundStatus)
  previousStatus: RefundStatus;

  @Enum(() => RefundStatus)
  newStatus: RefundStatus;

  @ManyToOne(() => User)
  changedBy: User;

  @Property({ type: 'text', nullable: true })
  memo?: string;
}
