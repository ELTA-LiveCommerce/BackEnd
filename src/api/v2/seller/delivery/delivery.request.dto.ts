import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import { SellerDeliverySearchField } from './delivery-search-field.enum';
import { SellerDeliveryDateField } from './delivery-date-field.enum';
import { PaginationRequestDto } from '@/api/v2/common/pagination.dto';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';

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
}

export class UpdateTrackingInfoRequestDto {
  @ApiProperty({ description: '송장 번호' })
  @IsNotEmpty()
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional({ description: '택배사' })
  @IsOptional()
  @IsString()
  courierCompany?: string;
}

export class UpdateDeliveryStatusRequestDto {
  @ApiProperty({ enum: DeliveryStatus, description: '배송 상태' })
  @IsNotEmpty()
  @IsEnum(DeliveryStatus)
  deliveryStatus: DeliveryStatus;
}
