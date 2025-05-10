import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * 상품 생성 DTO
 */
export class CreateProductDto {
  /**
   * 상품명
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * 상품 간략설명
   */
  @IsOptional()
  @IsString()
  shortDescription?: string;

  /**
   * 상품 상세설명
   */
  @IsString()
  @IsNotEmpty()
  description: string;

  /**
   * 상품 가격
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  /**
   * 할인 가격
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  /**
   * 재고 수량
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  stockQuantity: number;

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
