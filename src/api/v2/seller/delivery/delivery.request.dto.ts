import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { SellerDeliverySearchField } from './delivery-search-field.enum';
import { SellerDeliveryDateField } from './delivery-date-field.enum';
import { PaginationRequestDto } from '@/api/v2/common/pagination.dto';

export class SellerDeliveryListRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional({ enum: SellerDeliverySearchField, description: '검색 필드' })
  @IsOptional()
  @IsEnum(SellerDeliverySearchField)
  searchField?: SellerDeliverySearchField;

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @ApiPropertyOptional({ enum: SellerDeliveryDateField, description: '기간 검색 기준 필드' })
  @IsOptional()
  @IsEnum(SellerDeliveryDateField)
  dateField?: SellerDeliveryDateField;

  @ApiPropertyOptional({ description: '조회 시작일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '조회 종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '정렬 순서 (asc 또는 desc)', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ description: '페이지 번호', required: false, default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '페이지당 항목 수', required: false, default: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
