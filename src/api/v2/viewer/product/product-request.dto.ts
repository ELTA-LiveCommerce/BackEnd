import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ViewerProductSortBy {
  LATEST = 'latest', // 최신순
  PRICE_ASC = 'price_asc', // 가격 낮은순
  PRICE_DESC = 'price_desc', // 가격 높은순
  POPULARITY = 'popularity', // 인기순 (TODO: 추후 구현 시 기준 정의 필요)
}

export class ViewerProductListRequestDto {
  @ApiPropertyOptional({ description: '페이지 번호', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '검색어 (상품명, 설명 등)' })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  // TODO: 카테고리 ID 등 필터 조건 추가 가능
  // @ApiPropertyOptional({ description: '카테고리 ID' })
  // @IsOptional()
  // @IsUUID()
  // categoryId?: string;

  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: ViewerProductSortBy,
    default: ViewerProductSortBy.LATEST,
  })
  @IsOptional()
  @IsEnum(ViewerProductSortBy)
  sortBy?: ViewerProductSortBy = ViewerProductSortBy.LATEST;
}
