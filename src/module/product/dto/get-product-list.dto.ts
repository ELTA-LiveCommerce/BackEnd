import { IsOptional, IsString } from 'class-validator';

/**
 * 상품 목록 조회 DTO
 */
export class GetProductListDto {
  /**
   * 검색어 (상품명 기준)
   */
  @IsOptional()
  @IsString()
  search?: string;
}
