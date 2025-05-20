import { Entity, ManyToOne, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from './user.entity';

export enum BlockType {
  ACTIVE = 'ACTIVE',
  CAUTION = 'CAUTION',
  BLOCKED = 'BLOCKED',
}

@Entity({ tableName: 'seller_user_block' })
export class SellerUserBlock extends BaseEntity {
  @ManyToOne(() => User)
  seller!: User;

  @ManyToOne(() => User)
  blockedUser!: User;

  @Property({ default: true })
  isBlocked: boolean = true;

  @Enum({ items: () => BlockType, default: BlockType.BLOCKED, type: 'string' })
  type: BlockType = BlockType.BLOCKED;

  @Property({ type: 'text', nullable: true })
  reason?: string;

  constructor(seller: User, blockedUser: User, type: BlockType = BlockType.BLOCKED, reason?: string) {
    super();
    this.seller = seller;
    this.blockedUser = blockedUser;
    this.type = type;
    if (reason) {
      this.reason = reason;
    }
  }
}
