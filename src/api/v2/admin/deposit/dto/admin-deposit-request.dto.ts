import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DepositStatus } from '@/shared/enum/deposit-status.enum';

export enum AdminDepositSortBy {
  PRODUCT_NAME = 'productName',
  QUANTITY = 'quantity',
  AMOUNT = 'amount',
  DEPOSIT_DATE = 'depositDate',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminDepositListRequest {
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

  @ApiProperty({ description: '셀러 ID', example: 'user-123', required: true })
  @IsString()
  sellerId!: string;

  @ApiProperty({ description: '검색어', example: '상품명', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: AdminDepositSortBy,
    default: AdminDepositSortBy.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminDepositSortBy)
  sortBy?: AdminDepositSortBy = AdminDepositSortBy.CREATED_AT;

  @ApiProperty({
    description: '정렬 방향',
    enum: SortOrder,
    default: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class AdminUpdateDepositStatusRequest {
  @ApiProperty({ description: '입금 상태', enum: DepositStatus, example: DepositStatus.COMPLETED })
  @IsEnum(DepositStatus)
  status!: DepositStatus;
}

