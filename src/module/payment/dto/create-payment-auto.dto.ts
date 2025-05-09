import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 자동 결제 생성을 위한 DTO
 */
export class CreatePaymentAutoDto {
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
   * 결제 금액
   */
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  /**
   * 결제 방법
   */
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  /**
   * 트랜잭션 ID
   */
  @IsOptional()
  @IsString()
  transactionId?: string;
}
