export enum ReturnReasonCategory {
  SIMPLE_CHANGE_OF_MIND = 'SIMPLE_CHANGE_OF_MIND', // 단순 변심
  DELIVERY_ISSUE = 'DELIVERY_ISSUE', // 배송 문제
  PRODUCT_ISSUE = 'PRODUCT_ISSUE', // 상품 문제
}

export enum ReturnReasonDetail {
  // 단순 변심 사유
  DISLIKE_PRODUCT = 'DISLIKE_PRODUCT', // 상품이 마음에 들지 않음
  FOUND_CHEAPER_PRODUCT = 'FOUND_CHEAPER_PRODUCT', // 더 저렴한 상품을 발견함

  // 배송 문제 사유
  WRONG_PRODUCT_DELIVERED = 'WRONG_PRODUCT_DELIVERED', // 다른 상품이 배송됨

  // 상품 문제 사유
  MISSING_COMPONENTS = 'MISSING_COMPONENTS', // 상품의 구성품/부속품이 들어있지 않음
  DIFFERENT_FROM_DESCRIPTION = 'DIFFERENT_FROM_DESCRIPTION', // 상품이 설명과 다름
  DAMAGE_ON_DELIVERY = 'DAMAGE_ON_DELIVERY', // 상품이 파손되어 배송됨
  DEFECTIVE_PRODUCT = 'DEFECTIVE_PRODUCT', // 상품 결함/기능에 이상이 있음
}
