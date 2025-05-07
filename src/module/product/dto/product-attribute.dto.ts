import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/**
 * 상품 속성 생성 DTO
 */
export class CreateProductAttributeDto {
  /**
   * 상품 ID (직접 생성할 때만 필요)
   */
  @IsOptional()
  @IsUUID()
  productId?: string;

  /**
   * 속성 이름 (예: '모델명', '브랜드', '제조사', '원산지' 등)
   */
  @IsString()
  name: string;

  /**
   * 속성 값
   */
  @IsString()
  value: string;

  /**
   * 정렬 순서
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  /**
   * 표시 여부
   */
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

/**
 * 상품 속성 수정 DTO
 */
export class UpdateProductAttributeDto {
  /**
   * 속성 이름 (예: '모델명', '브랜드', '제조사', '원산지' 등)
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * 속성 값
   */
  @IsOptional()
  @IsString()
  value?: string;

  /**
   * 정렬 순서
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  /**
   * 표시 여부
   */
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

/**
 * 상품 속성 응답 DTO
 */
export class ProductAttributeResponseDto {
  /**
   * 속성 ID
   */
  id: string;

  /**
   * 상품 ID
   */
  productId: string;

  /**
   * 속성 이름
   */
  name: string;

  /**
   * 속성 값
   */
  value: string;

  /**
   * 정렬 순서
   */
  sortOrder: number;

  /**
   * 표시 여부
   */
  isVisible: boolean;

  /**
   * 생성일
   */
  createdAt: Date;

  /**
   * 수정일
   */
  updatedAt: Date;
}
