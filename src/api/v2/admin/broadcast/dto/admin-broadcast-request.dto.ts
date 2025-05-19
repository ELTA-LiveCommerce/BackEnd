import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

export enum AdminBroadcastSortBy {
  TITLE = 'title',
  SCHEDULED_AT = 'scheduledAt',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminBroadcastListRequest {
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

  @ApiProperty({ description: '판매자 ID', required: false })
  @IsOptional()
  @IsUUID(4)
  sellerId?: string;

  @ApiProperty({ description: '검색어 (방송 제목)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: AdminBroadcastSortBy,
    default: AdminBroadcastSortBy.SCHEDULED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminBroadcastSortBy)
  sortBy?: AdminBroadcastSortBy = AdminBroadcastSortBy.SCHEDULED_AT;

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
