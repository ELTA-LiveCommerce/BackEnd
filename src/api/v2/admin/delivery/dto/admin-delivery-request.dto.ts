import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus } from '@/module/delivery/entity/delivery.entity';

export enum AdminDeliverySortBy {
  PRODUCT_NAME = 'productName',
  QUANTITY = 'quantity',
  TRACKING_NUMBER = 'trackingNumber',
  DELIVERY_STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminDeliveryListRequest {
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
    enum: AdminDeliverySortBy,
    default: AdminDeliverySortBy.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminDeliverySortBy)
  sortBy?: AdminDeliverySortBy = AdminDeliverySortBy.CREATED_AT;

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

export class AdminUpdateDeliveryStatusRequest {
  @ApiProperty({ description: '배송 상태', enum: DeliveryStatus, example: DeliveryStatus.DELIVERED })
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;
}

export class AdminUpdateDeliveryTrackingRequest {
  @ApiProperty({ description: '송장 번호', example: '123456789' })
  @IsString()
  trackingNumber!: string;

  @ApiProperty({ description: '배송 업체', example: '우체국택배', required: false })
  @IsString()
  @IsOptional()
  courierCompany?: string;
}
