import { PaginationRequestDto } from '@/api/v2/common/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsIn } from 'class-validator';
import { SellerDepositSearchField } from './deposit-search-field.enum';
import { SellerDepositDateField } from './deposit-date-field.enum';

// TODO: Add deposit-specific search fields (e.g., productName, buyerName)
// enum SellerDepositSearchField { ... }

// TODO: Add deposit-specific date fields (e.g., depositDate)
// enum SellerDepositDateField { ... }

/**
 * 판매자 입금 목록 조회 요청 DTO
 */
export class SellerDepositListRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional({ enum: SellerDepositSearchField, description: '검색 필드' })
  @IsOptional()
  @IsEnum(SellerDepositSearchField)
  searchField?: SellerDepositSearchField;

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @ApiPropertyOptional({ enum: SellerDepositDateField, description: '기간 검색 기준 필드' })
  @IsOptional()
  @IsEnum(SellerDepositDateField)
  dateField?: SellerDepositDateField;

  @ApiPropertyOptional({ description: '조회 시작일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '조회 종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Added sortOrder based on previous Delivery example
  @ApiPropertyOptional({ description: '정렬 순서 (asc 또는 desc)', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
