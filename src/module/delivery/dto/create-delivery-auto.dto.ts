import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

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
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  /**
   * 수령인 이름
   */
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  /**
   * 수령인 전화번호
   */
  @IsNotEmpty()
  @IsString()
  recipientPhoneNumber: string;

  /**
   * 주소 필드 통합
   */
  @IsNotEmpty()
  @IsString()
  address: string;
}
