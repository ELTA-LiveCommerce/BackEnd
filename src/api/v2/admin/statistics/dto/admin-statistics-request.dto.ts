import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum SellerStatisticsSortField {
  SELLER_NAME = 'sellerName',
  TOTAL_SALES = 'totalSales',
  PRODUCT_COUNT = 'productCount',
  BROADCAST_COUNT = 'broadcastCount',
  MAX_VIEWERS = 'maxViewers',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminSellerStatisticsRequest {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: '페이지당 항목 수', example: 10, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ description: '검색어 (셀러명)', example: '홍길동', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '정렬 기준 필드',
    enum: SellerStatisticsSortField,
    example: SellerStatisticsSortField.TOTAL_SALES,
    required: false,
  })
  @IsEnum(SellerStatisticsSortField)
  @IsOptional()
  sortBy?: SellerStatisticsSortField = SellerStatisticsSortField.TOTAL_SALES;

  @ApiProperty({
    description: '정렬 방향',
    enum: SortOrder,
    example: SortOrder.DESC,
    required: false,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
