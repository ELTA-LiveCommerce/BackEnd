/**
 * 상품 목록 아이템 DTO
 * 관리자 페이지에서 사용하는 상품 목록 아이템
 */
export class ProductListItemDto {
  /**
   * 상품 ID
   */
  id: string;

  /**
   * 상품명
   */
  name: string;

  /**
   * 상품 가격
   */
  price: number;

  /**
   * 재고 수량
   */
  stockQuantity: number;

  /**
   * 대표 이미지 URL
   */
  mainImage?: string;

  /**
   * 생성일
   */
  createdAt: Date;

  /**
   * 수정일
   */
  updatedAt: Date;
}
