import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, IsUUID } from 'class-validator';

import { OrderStatus } from '@/shared/enum/order-status.enum';

export class GetOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum({ ASC: 'ASC', DESC: 'DESC' })
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsString()
  after?: string;
}
