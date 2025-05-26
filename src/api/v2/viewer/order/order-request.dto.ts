import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@/shared/enum/order-status.enum';

export class OrderItemRequest {
  @ApiProperty({ description: '상품 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  @IsUUID(4)
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: '주문 수량', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '상품 옵션 (JSON string)', example: '{"color": "Red", "size": "M"}', required: false })
  @IsOptional()
  @IsString()
  attributes?: string;
}

export class CreateOrderRequest {
  @ApiProperty({ type: [OrderItemRequest], description: '주문 상품 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemRequest)
  items: OrderItemRequest[];
}

export class GetOrdersRequest {
  @ApiProperty({ enum: OrderStatus, description: '주문 상태', required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: '검색어', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: '페이지 번호', example: 1, default: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '페이지당 항목 수', example: 10, default: 10, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: '정렬 기준', example: 'createdAt', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ enum: ['ASC', 'DESC'], description: '정렬 방향', example: 'DESC', required: false })
  @IsOptional()
  @IsEnum({ ASC: 'ASC', DESC: 'DESC' })
  order?: 'ASC' | 'DESC';

  @ApiProperty({ description: '커서 기반 페이지네이션의 기준점', required: false })
  @IsOptional()
  @IsString()
  after?: string;
}

export class CancelOrderRequest {
  @ApiProperty({ description: '취소 사유', example: '단순 변심', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateShippingRequest {
  @ApiProperty({ description: '운송장 번호', example: '1234567890' })
  @IsNotEmpty({ message: '운송장 번호는 필수 입력입니다.' })
  @IsString({ message: '운송장 번호는 문자열이어야 합니다.' })
  shippingCode: string;

  @ApiProperty({ enum: OrderStatus, description: '주문 상태', required: false })
  @IsOptional()
  @IsEnum(OrderStatus, { message: '유효하지 않은 주문 상태입니다.' })
  status?: OrderStatus;

  @ApiProperty({ description: '배송 메모', example: '문 앞에 놓아주세요', required: false })
  @IsOptional()
  @IsString({ message: '배송 메모는 문자열이어야 합니다.' })
  shippingMemo?: string;
}

