import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity'; // 공통 BaseEntity가 있다면 사용

@Entity({ tableName: 'broadcasts' })
export class Broadcast extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @Property()
  title!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property()
  streamKey!: string; // 실제 스트림 키

  @Property({ default: false })
  isLive!: boolean;

  @Property({ type: 'date' })
  scheduledDate!: Date; // 방송 예정 날짜

  @Property({ nullable: true })
  thumbnailImage?: string; // 대표 이미지 URL

  // User (Seller)와의 관계 설정
  @ManyToOne(() => User)
  seller!: User;

  // BroadcastProduct와의 관계 설정 (방송에 연결된 상품)
  @OneToMany(() => BroadcastProduct, (broadcastProduct) => broadcastProduct.broadcast, { orphanRemoval: true })
  products = new Collection<BroadcastProduct>(this);

  constructor() {
    super();
  }
}
