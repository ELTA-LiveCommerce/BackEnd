/**
 * 상품 상태 정의
 */
export enum ProductStatus {
  /**
   * 판매중 상태
   */
  ACTIVE = 'active',

  /**
   * 품절 상태
   */
  SOLD_OUT = 'sold_out',

  /**
   * 판매 중지 상태
   */
  INACTIVE = 'inactive',

  /**
   * 준비중 상태 (등록되었지만 판매 시작 전)
   */
  PENDING = 'pending',

  /**
   * 삭제됨 상태
   */
  DELETED = 'deleted',
}
