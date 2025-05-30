import { ArrayType, Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';

export enum ProductStatus {
  DEFAULT = 'DEFAULT',
  SOLDOUT = 'SOLDTOUT',
  SALESEND = 'SALESEND',
  ONSALE = 'ONSALE',
}

/**
 * 상품 엔티티
 */
@Entity({ tableName: 'products' })
export class Product extends BaseEntity {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  /**
   * 상품명
   */
  @Property({ type: 'string' })
  name: string;

  /**
   * 상품 간략설명
   */
  @Property({ type: 'text', nullable: true })
  shortDescription: string;

  /**
   * 상품 상세설명
   */
  @Property({ type: 'text' })
  description: string;

  /**
   * 상품 가격
   */
  @Property({ type: 'number' })
  price: number;

  /**
   * 할인 가격
   */
  @Property({ nullable: true, type: 'number' })
  discountPrice?: number;

  /**
   * 재고 수량
   */
  @Property({ default: 0, type: 'number' })
  stockQuantity: number = 0;

  /**
   * 상품 상태
   */
  @Enum({ items: () => ProductStatus, type: 'string', default: ProductStatus.DEFAULT })
  status: ProductStatus = ProductStatus.DEFAULT;

  /**
   * 대표 이미지 URL
   */
  @Property({ nullable: true, type: 'string' })
  mainImage: string;

  /**
   * 추가 이미지 URL 목록
   */
  @Property({ type: ArrayType, nullable: true })
  images?: string[];

  /**
   * 판매자
   */
  @ManyToOne(() => User)
  seller: User;

  /**
   * 상품 공개 여부
   */
  @Property({ type: 'boolean', default: true })
  isPublic: boolean = true;
}

