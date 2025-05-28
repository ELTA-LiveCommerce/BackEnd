import { Entity, OneToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from './user.entity';

@Entity({ tableName: 'seller_infos' })
export class SellerInfo extends BaseEntity {
  // User와의 1:1 관계 설정
  @OneToOne(() => User, (user) => user.sellerInfo, { owner: true, primary: true, mapToPk: true, fieldName: 'user_id' })
  user!: User;

  @Property({ nullable: true, type: 'string' })
  businessName?: string; // 상호명

  @Property({ nullable: true, type: 'string' })
  businessAddress?: string; // 사업자주소

  @Property({ nullable: true, type: 'string' })
  businessNumber?: string; // 사업자번호

  constructor(data?: Partial<SellerInfo>) {
    super();
    Object.assign(this, data);
  }
}

