import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, ManyToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity'; // 공통 BaseEntity가 있다면 사용
import { Product } from '@/module/product/entity/product.entity';

@Entity({ tableName: 'broadcasts' })
export class Broadcast extends BaseEntity {
  // @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  // id: string;

  @ManyToOne(() => User)
  seller: User;

  @Property()
  title: string;

  @Property({ nullable: true })
  thumbnailUrl?: string;

  // TODO: Define relation with Product, potentially ManyToMany
  // @ManyToMany(() => Product, product => product.broadcasts, { owner: true })
  // products = new Collection<Product>(this);

  @Property()
  scheduledAt: Date;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string' })
  streamKey!: string; // 실제 스트림 키

  @Property({ type: 'boolean', default: false })
  isLive!: boolean;

  @Property({ type: 'string', nullable: true })
  thumbnailImage?: string; // 대표 이미지 URL

  // BroadcastProduct와의 관계 설정 (방송에 연결된 상품)
  @OneToMany(() => BroadcastProduct, (broadcastProduct) => broadcastProduct.broadcast, { orphanRemoval: true })
  products = new Collection<BroadcastProduct>(this);

  constructor(seller: User, title: string, scheduledAt: Date) {
    super();
    this.seller = seller;
    this.title = title;
    this.scheduledAt = scheduledAt;
  }
}

@Entity()
export class Stream {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => User)
  seller: User;

  @Property()
  startedAt = new Date();

  @Property({ nullable: true })
  endedAt?: Date;

  @Property({
    type: 'json',
    nullable: true,
    defaultRaw: "'{}'::jsonb",   // ← Postgres 에 유효 JSON 기본값 생성
  })
  metadata?: Record<string, any>;
}

