import { Collection, Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { BaseEntity } from '@/shared/entity/base.entity';
import { ProductStatus } from '@/shared/enum/product-status.enum';

import { ProductAttribute } from './product-attribute.entity';

/**
 * 상품 엔티티
 */
@Entity({ tableName: 'products' })
export class Product extends BaseEntity {
  @PrimaryKey()
  id: string = v4();

  /**
   * 상품명
   */
  @Property()
  name: string;

  /**
   * 상품 설명
   */
  @Property({ type: 'text' })
  description: string;

  /**
   * 상품 가격
   */
  @Property()
  price: number;

  /**
   * 할인가
   */
  @Property({ nullable: true })
  discountPrice?: number;

  /**
   * 할인율 (%)
   */
  @Property({ nullable: true })
  discountRate?: number;

  /**
   * 재고 수량
   */
  @Property({ default: 0 })
  stockQuantity: number = 0;

  /**
   * 상품 상태
   */
  @Enum({ items: () => ProductStatus, default: ProductStatus.PENDING })
  status: ProductStatus = ProductStatus.PENDING;

  /**
   * 대표 이미지 URL
   */
  @Property({ nullable: true })
  thumbnailUrl?: string;

  /**
   * 상세 이미지 URL 목록 (콤마로 구분)
   */
  @Property({ nullable: true })
  imageUrls?: string;

  /**
   * 판매자
   */
  @ManyToOne(() => User)
  seller: User;

  /**
   * 상품 부가 정보 (모델명, 브랜드, 제조사, 원산지 등)
   */
  @OneToMany(() => ProductAttribute, (attribute) => attribute.product, { orphanRemoval: true })
  attributes = new Collection<ProductAttribute>(this);

  /**
   * 외부 상품 ID (nhn shopby 등 외부 API 연동용)
   */
  @Property({ nullable: true })
  externalId?: string;

  /**
   * 상품 코드 (SKU)
   */
  @Property({ nullable: true })
  productCode?: string;

  /**
   * 배송비
   */
  @Property({ nullable: true, default: 0 })
  shippingFee: number = 0;

  /**
   * 판매 시작일
   */
  @Property({ nullable: true })
  saleStartDate?: Date;

  /**
   * 판매 종료일
   */
  @Property({ nullable: true })
  saleEndDate?: Date;

  /**
   * 이미지 URL 배열로 변환
   */
  get images(): string[] {
    return this.imageUrls ? this.imageUrls.split(',') : [];
  }

  /**
   * 이미지 URL 배열을 문자열로 저장
   */
  set images(urls: string[]) {
    this.imageUrls = urls.join(',');
  }

  /**
   * 할인가 계산
   * 할인율이 설정되어 있으면 원가에서 할인율을 적용한 가격을 반환
   * 할인가가 직접 설정되어 있으면 해당 가격을 우선 사용
   */
  get finalPrice(): number {
    if (this.discountPrice !== undefined && this.discountPrice !== null) {
      return this.discountPrice;
    }

    if (this.discountRate !== undefined && this.discountRate !== null) {
      return Math.round(this.price * (1 - this.discountRate / 100));
    }

    return this.price;
  }
}
