import { Entity, ManyToOne, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from './user.entity';

export enum BlockType {
  FULL_BLOCK = 'FULL_BLOCK', // 완전 차단
  WARNING_ONLY = 'WARNING_ONLY', // 경고만 표시
}

@Entity({ tableName: 'seller_user_block' })
export class SellerUserBlock extends BaseEntity {
  @ManyToOne(() => User)
  seller!: User;

  @ManyToOne(() => User)
  blockedUser!: User;

  @Property({ default: true })
  isBlocked: boolean = true;

  @Enum({ items: () => BlockType, default: BlockType.FULL_BLOCK, type: 'string' })
  type: BlockType = BlockType.FULL_BLOCK;

  @Property({ type: 'text', nullable: true })
  reason?: string;

  constructor(seller: User, blockedUser: User, type: BlockType = BlockType.FULL_BLOCK, reason?: string) {
    super();
    this.seller = seller;
    this.blockedUser = blockedUser;
    this.type = type;
    if (reason) {
      this.reason = reason;
    }
  }
}
