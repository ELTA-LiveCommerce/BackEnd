import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationRequestDto } from '@/api/v2/common/pagination.dto';
import { SellerProductSearchField } from '@/shared/enum/seller-product-search-field.enum';
import { SellerProductDateField } from '@/shared/enum/seller-product-date-field.enum';

export class SellerProductListRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional({
    description: '검색할 키워드. `searchField` 파라미터로 지정된 필드를 대상으로 검색합니다.',
    example: '캠핑',
  })
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @ApiPropertyOptional({
    description: '검색 대상 필드',
    enum: SellerProductSearchField,
    default: SellerProductSearchField.NAME,
  })
  @IsOptional()
  @IsEnum(SellerProductSearchField)
  searchField?: SellerProductSearchField = SellerProductSearchField.NAME;

  @ApiPropertyOptional({
    description: '검색 시작일. `dateField` 파라미터로 지정된 필드를 기준으로 이 날짜 이후의 데이터를 조회합니다.',
    example: '2023-01-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: '검색 종료일. `dateField` 파라미터로 지정된 필드를 기준으로 이 날짜 이전의 데이터를 조회합니다.',
    example: '2023-12-31T23:59:59.999Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: '기간 검색 대상 필드',
    enum: SellerProductDateField,
    default: SellerProductDateField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SellerProductDateField)
  dateField?: SellerProductDateField = SellerProductDateField.CREATED_AT;
}
