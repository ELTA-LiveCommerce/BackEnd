import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, Max, IsNumber, IsPositive } from 'class-validator';

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
  @ApiPropertyOptional({ description: '셀러 ID', example: 'seller-uuid' })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 크기', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '검색어 (방송 제목)', example: '라이브 방송' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '정렬 기준', example: 'createdAt' })
  @IsOptional()
  @IsEnum(AdminBroadcastSortBy)
  sortBy?: AdminBroadcastSortBy;

  @ApiPropertyOptional({ description: '정렬 순서', example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export class UpdateViewersCountRequest {
  @ApiProperty({
    description: '설정할 시청자수',
    example: 150,
    minimum: 0,
    maximum: 999999,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: '시청자수는 0 이상이어야 합니다.' })
  @Max(999999, { message: '시청자수는 999,999 이하여야 합니다.' })
  currentViewers: number;
}

export class UpdateMaxViewersRequest {
  @ApiProperty({
    description: '최대 시청자수',
    example: 100,
    minimum: 0,
    maximum: 999999,
  })
  @IsNumber()
  @IsPositive()
  @Min(0)
  @Max(999999)
  maxViewers!: number;
}

