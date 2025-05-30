import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDateString, IsInt } from 'class-validator';
import { SellerProductSearchField } from './search-field.enum';
import { SellerProductDateField } from './date-field.enum';
import { ProductStatus } from '../../../../module/product/entity/product.entity';

export class SellerProductCreateRequestDto {
  @ApiProperty({ description: '상품명', example: '새로운 멋진 상품' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '판매가', example: 35000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: '재고 수량', example: 50 })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({ description: '상품 간략설명', example: '이 상품은 정말 특별해요!', required: false })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({ description: '상품 상세설명', example: '상세 설명 내용입니다...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '대표 이미지 URL', example: 'https://example.com/main-image.jpg', required: false })
  @IsUrl()
  @IsOptional()
  mainImage?: string;

  @ApiProperty({
    description: '추가 이미지 URL 목록',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: false,
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: '상품 공개 여부', example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;
}

export class SellerProductUpdateRequestDto {
  @ApiProperty({ description: '상품명', example: '수정된 멋진 상품', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '판매가', example: 36000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ description: '재고 수량', example: 45, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiProperty({ description: '상품 상태', required: false })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ description: '상품 간략설명', example: '수정된 간략 설명!', required: false })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({ description: '상품 상세설명', example: '수정된 상세 설명 내용입니다...', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '대표 이미지 URL', example: 'https://example.com/new-main-image.jpg', required: false })
  @IsUrl()
  @IsOptional()
  mainImage?: string;

  @ApiProperty({
    description: '추가 이미지 URL 목록',
    example: ['https://example.com/new-image1.jpg'],
    required: false,
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: '상품 공개 여부', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class SellerProductListRequestDto {
  @ApiProperty({
    description: '검색할 필드',
    enum: SellerProductSearchField,
    required: false,
    default: SellerProductSearchField.NAME,
    example: SellerProductSearchField.NAME,
  })
  @IsEnum(SellerProductSearchField)
  @IsOptional()
  searchField?: SellerProductSearchField = SellerProductSearchField.NAME;

  @ApiProperty({ description: '선택된 필드에 대한 검색어', required: false })
  @IsString()
  @IsOptional()
  searchKeyword?: string;

  @ApiProperty({
    description: '기간 검색 기준 필드',
    enum: SellerProductDateField,
    required: false,
    default: SellerProductDateField.CREATED_AT,
    example: SellerProductDateField.CREATED_AT,
  })
  @IsEnum(SellerProductDateField)
  @IsOptional()
  dateField?: SellerProductDateField = SellerProductDateField.CREATED_AT;

  @ApiProperty({
    description: '검색 시작일 (선택된 기간 필드 기준, YYYY-MM-DD)',
    required: false,
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: '검색 종료일 (선택된 기간 필드 기준, YYYY-MM-DD)',
    required: false,
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: '페이지 번호', required: false, default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '페이지당 항목 수', required: false, default: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
