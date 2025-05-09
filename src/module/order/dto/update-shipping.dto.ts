import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { OrderStatus } from '@/shared/enum/order-status.enum';

export class UpdateShippingDto {
  @IsNotEmpty({ message: '운송장 번호는 필수 입력입니다.' })
  @IsString({ message: '운송장 번호는 문자열이어야 합니다.' })
  @MaxLength(50, { message: '운송장 번호는 50자를 초과할 수 없습니다.' })
  shippingCode: string;

  @IsOptional()
  @IsEnum(OrderStatus, { message: '유효하지 않은 주문 상태입니다.' })
  status?: OrderStatus;

  @IsOptional()
  @IsString({ message: '배송 메모는 문자열이어야 합니다.' })
  @MaxLength(255, { message: '배송 메모는 255자를 초과할 수 없습니다.' })
  shippingMemo?: string;
}
