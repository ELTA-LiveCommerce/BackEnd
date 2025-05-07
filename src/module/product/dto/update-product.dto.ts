import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

import { ProductStatus } from '@/shared/enum/product-status.enum';

import { CreateProductAttributeDto, UpdateProductAttributeDto } from './product-attribute.dto';

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
   * 상품 설명
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
   * 할인가
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  /**
   * 할인율 (%)
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  /**
   * 재고 수량
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  /**
   * 상품 상태
   */
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  /**
   * 대표 이미지 URL
   */
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  /**
   * 상세 이미지 URL 목록
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  /**
   * 상품 카테고리 ID 목록
   */
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

  /**
   * 새로 추가할 상품 속성 목록
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductAttributeDto)
  attributes?: CreateProductAttributeDto[];

  /**
   * 기존 속성 수정 목록: { attributeId: string, updates: UpdateProductAttributeDto }
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductAttributeWithIdDto)
  attributeUpdates?: UpdateProductAttributeWithIdDto[];

  /**
   * 삭제할 속성 ID 목록
   */
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  attributeIdsToRemove?: string[];

  /**
   * 외부 상품 ID (nhn shopby 등 외부 API 연동용)
   */
  @IsOptional()
  @IsString()
  externalId?: string;

  /**
   * 상품 코드 (SKU)
   */
  @IsOptional()
  @IsString()
  productCode?: string;

  /**
   * 배송비
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  /**
   * 판매 시작일
   */
  @IsOptional()
  saleStartDate?: Date;

  /**
   * 판매 종료일
   */
  @IsOptional()
  saleEndDate?: Date;
}

/**
 * 업데이트할 속성과 ID를 포함하는 DTO
 */
export class UpdateProductAttributeWithIdDto {
  /**
   * 속성 ID
   */
  @IsUUID()
  id: string;

  /**
   * 속성 업데이트 내용
   */
  @ValidateNested()
  @Type(() => UpdateProductAttributeDto)
  updates: UpdateProductAttributeDto;
}
