import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Min, IsInt } from 'class-validator';

/**
 * 판매자 검색 요청 DTO
 */
export class SellerSearchRequestDto {
  @IsNotEmpty()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 판매자 정보 요청 DTO
 */
export class SellerInfoRequestDto {
  // 필요한 경우 쿼리 파라미터 추가
}

/**
 * 판매자 라이브 방송 요청 DTO
 */
export class SellerLiveRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 판매자 상품 요청 DTO
 */
export class SellerProductRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
