import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationRequestDto } from '@/api/v2/common/pagination.dto';
import { RefundStatus } from '@/shared/enum/refund-status.enum';
import { SellerRefundDateField } from '@/shared/enum/seller-refund-date-field.enum';
import { SellerRefundSearchField } from '@/shared/enum/seller-refund-search-field.enum';

export class SellerRefundListRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional({
    description: '검색할 키워드. `searchField` 파라미터로 지정된 필드를 대상으로 검색합니다.',
    example: '불량',
  })
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @ApiPropertyOptional({
    description: '검색 대상 필드',
    enum: SellerRefundSearchField,
    default: SellerRefundSearchField.PRODUCT_NAME,
  })
  @IsOptional()
  @IsEnum(SellerRefundSearchField)
  searchField?: SellerRefundSearchField = SellerRefundSearchField.PRODUCT_NAME;

  @ApiPropertyOptional({
    description: '필터링할 반품 상태',
    enum: RefundStatus,
  })
  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @ApiPropertyOptional({
    description: '검색 시작일. `dateField` 파라미터로 지정된 필드를 기준으로 이 날짜 이후의 데이터를 조회합니다.',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: '검색 종료일. `dateField` 파라미터로 지정된 필드를 기준으로 이 날짜 이전의 데이터를 조회합니다.',
    example: '2024-01-31T23:59:59.999Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: '기간 검색 대상 필드',
    enum: SellerRefundDateField,
    default: SellerRefundDateField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SellerRefundDateField)
  dateField?: SellerRefundDateField = SellerRefundDateField.CREATED_AT;
}
