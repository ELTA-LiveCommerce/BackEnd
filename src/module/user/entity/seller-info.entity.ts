import { Entity, OneToOne } from '@mikro-orm/core';
import { BaseEntity } from '@/shared/entity/base.entity';
import { User } from './user.entity';

@Entity({ tableName: 'seller_infos' })
export class SellerInfo extends BaseEntity {
  // User와의 1:1 관계 설정
  @OneToOne(() => User, (user) => user.sellerInfo, { owner: true, primary: true, mapToPk: true, fieldName: 'user_id' })
  user!: User;

  constructor(data?: Partial<SellerInfo>) {
    super();
    Object.assign(this, data);
  }
}
