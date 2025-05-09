import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * 상품 수정 DTO
 */
export class UpdateProductDto {
  /**
   * 상품명
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * 상품 간략설명
   */
  @IsOptional()
  @IsString()
  shortDescription?: string;

  /**
   * 상품 상세설명
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * 상품 가격
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  /**
   * 재고 수량
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  /**
   * 대표 이미지 URL
   */
  @IsOptional()
  @IsString()
  mainImage?: string;

  /**
   * 추가 이미지 URL 목록
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
