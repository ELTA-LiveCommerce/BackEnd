import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ManyToMany } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity'; // 공통 BaseEntity가 있다면 사용
import { Product } from '@/module/product/entity/product.entity';
import { Stream } from './stream.entity';

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
  // products: Product[] = [];

  @Property()
  scheduledAt: Date;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string', nullable: true })
  streamKey?: string;

  @Property({ type: 'boolean', default: false })
  isLive: boolean = false;

  @Property({ type: 'number', default: 0 })
  maxViewers: number = 0;

  @OneToOne(() => Stream, (stream) => stream.broadcast, {
    orphanRemoval: true,
    nullable: true,
  })
  stream?: Stream;

  // BroadcastProduct와의 관계 설정 (방송에 연결된 상품)
  @OneToMany(() => BroadcastProduct, (broadcastProduct) => broadcastProduct.broadcast, {
    orphanRemoval: true,
    eager: true,
  })
  products: BroadcastProduct[] = [];

  constructor(seller: User, title: string, description: string, scheduledAt: Date, thumbnailUrl?: string) {
    super();
    this.seller = seller;
    this.title = title;
    this.description = description;
    this.scheduledAt = scheduledAt;
    this.thumbnailUrl = thumbnailUrl;
  }

  startLive() {
    this.isLive = true;
    return this;
  }

  endLive() {
    this.isLive = false;
    return this;
  }

  updateMaxViewers(currentViewers: number) {
    if (currentViewers > this.maxViewers) {
      this.maxViewers = currentViewers;
    }
    return this;
  }
}

