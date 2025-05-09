import { IsNotEmpty, IsString, IsArray } from 'class-validator';

/**
 * 자동 배송 생성을 위한 DTO
 */
export class CreateDeliveryAutoDto {
  /**
   * 주문 ID
   */
  @IsNotEmpty()
  @IsString()
  orderId: string;

  /**
   * 판매자 ID
   */
  @IsNotEmpty()
  @IsString()
  sellerId: string;

  /**
   * 상품 ID 목록
   */
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  /**
   * 배송지 주소
   */
  @IsNotEmpty()
  @IsString()
  shippingAddress: string;
}
