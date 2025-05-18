import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdminProductSortBy {
  NAME = 'name',
  PRICE = 'price',
  STOCK = 'stock',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminProductListRequest {
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

  @ApiProperty({ description: '카테고리', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '판매자 ID', required: false })
  @IsOptional()
  @IsUUID(4)
  sellerId?: string;

  @ApiProperty({ description: '검색어 (상품명, 설명)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: AdminProductSortBy,
    default: AdminProductSortBy.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminProductSortBy)
  sortBy?: AdminProductSortBy = AdminProductSortBy.CREATED_AT;

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

export class AdminCreateProductRequest {
  @ApiProperty({ description: '상품명', example: '멋진 상품' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '상품 설명', example: '이 상품은 매우 멋집니다.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: '판매자 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  @IsNotEmpty()
  @IsUUID(4)
  sellerId: string;

  @ApiProperty({ description: '가격', example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: '할인 가격', example: 9000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiProperty({ description: '재고 수량', example: 100 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ description: '카테고리', example: '의류' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: '이미지 URL 배열', example: ['image1.jpg', 'image2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: '옵션 (JSON string)',
    example: '{"colors": ["Red", "Blue"], "sizes": ["S", "M", "L"]}',
    required: false,
  })
  @IsOptional()
  @IsString()
  options?: string;
}

export class AdminUpdateProductRequest {
  @ApiProperty({ description: '상품명', example: '멋진 상품', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '상품 설명', example: '이 상품은 매우 멋집니다.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '판매자 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6', required: false })
  @IsOptional()
  @IsUUID(4)
  sellerId?: string;

  @ApiProperty({ description: '가격', example: 10000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ description: '할인 가격', example: 9000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiProperty({ description: '재고 수량', example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({ description: '카테고리', example: '의류', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '이미지 URL 배열', example: ['image1.jpg', 'image2.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: '옵션 (JSON string)',
    example: '{"colors": ["Red", "Blue"], "sizes": ["S", "M", "L"]}',
    required: false,
  })
  @IsOptional()
  @IsString()
  options?: string;
}

