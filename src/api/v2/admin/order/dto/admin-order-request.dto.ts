import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@/shared/enum/order-status.enum';

export class AdminOrderListRequest {
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

  @ApiProperty({ enum: OrderStatus, description: '주문 상태', required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: '사용자 ID', required: false })
  @IsOptional()
  @IsUUID(4)
  userId?: string;

  @ApiProperty({ description: '검색어 (주문번호, 상품명)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: '시작 날짜', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ description: '종료 날짜', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class AdminUpdateOrderStatusRequest {
  @ApiProperty({ enum: OrderStatus, description: '주문 상태' })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ description: '상태 변경 사유', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
