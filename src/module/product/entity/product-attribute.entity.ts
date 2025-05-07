import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { BaseEntity } from '@/shared/entity/base.entity';

import { Product } from './product.entity';

/**
 * 상품 속성 엔티티
 * 상품의 추가 정보(모델명, 브랜드, 제조사, 원산지 등)를 동적으로 관리
 */
@Entity({ tableName: 'product_attributes' })
export class ProductAttribute extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  /**
   * 연결된 상품
   */
  @ManyToOne(() => Product)
  product: Product;

  /**
   * 속성 이름 (예: '모델명', '브랜드', '제조사', '원산지' 등)
   */
  @Property()
  name: string;

  /**
   * 속성 값
   */
  @Property()
  value: string;

  /**
   * 정렬 순서
   */
  @Property({ default: 0 })
  sortOrder: number = 0;

  /**
   * 표시 여부
   */
  @Property({ default: true })
  isVisible: boolean = true;
}
