import { Entity, Enum, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { BaseEntity } from '@/shared/entity/base.entity';

import { Product } from './product.entity';

/**
 * 방송별 상품 노출 상태
 */
export enum BroadcastProductStatus {
  /**
   * 준비 상태 (방송 시작 전)
   */
  PENDING = 'pending',

  /**
   * 현재 판매중 상태
   */
  SELLING = 'selling',

  /**
   * 판매 완료 상태
   */
  SOLD = 'sold',

  /**
   * 판매 중지 상태
   */
  STOPPED = 'stopped',
}

/**
 * 방송별 상품 연결 엔티티
 * 라이브 방송에서 판매하는 상품 정보를 관리
 */
@Entity({ tableName: 'broadcast_products' })
@Unique({ properties: ['broadcastId'] })
export class BroadcastProduct extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  /**
   * 방송 ID
   * Broadcast 엔티티가 구현된 후 외래키로 변경 예정
   * 한 방송에는 한 상품만 연결할 수 있음
   */
  @Property()
  broadcastId: string;

  /**
   * 상품
   */
  @ManyToOne(() => Product)
  product: Product;

  /**
   * 방송에서의 상품 순서
   */
  @Property({ default: 0 })
  sortOrder: number = 0;

  /**
   * 방송 특별가 (방송에서만 적용되는 할인가)
   */
  @Property({ nullable: true })
  specialPrice?: number;

  /**
   * 방송에서의 상품 상태
   */
  @Enum({ items: () => BroadcastProductStatus, default: BroadcastProductStatus.PENDING })
  status: BroadcastProductStatus = BroadcastProductStatus.PENDING;

  /**
   * 방송에서 판매된 수량
   */
  @Property({ default: 0 })
  soldQuantity: number = 0;

  /**
   * 방송에서 표시될 상품 설명 (기본 상품 설명과 다를 수 있음)
   */
  @Property({ nullable: true, type: 'text' })
  broadcastDescription?: string;
}
