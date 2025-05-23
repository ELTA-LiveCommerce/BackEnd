import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, IsNumber, Max } from 'class-validator';

export enum AdminFeeSortBy {
  SELLER_NAME = 'name',
  PHONE_NUMBER = 'phoneNumber',
  FEE_PERCENTAGE = 'feePercentage',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminFeeListRequest {
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

  @ApiProperty({ description: '검색어 (셀러명, 전화번호)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: AdminFeeSortBy,
    default: AdminFeeSortBy.SELLER_NAME,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminFeeSortBy)
  sortBy?: AdminFeeSortBy = AdminFeeSortBy.SELLER_NAME;

  @ApiProperty({
    description: '정렬 방향',
    enum: SortOrder,
    default: SortOrder.ASC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}

export class AdminUpdateFeeRequest {
  @ApiProperty({ description: '수수료 비율 (0.01~0.99)', example: 0.1 })
  @IsNumber()
  @Min(0.01)
  @Max(0.99)
  feePercentage: number;
}

