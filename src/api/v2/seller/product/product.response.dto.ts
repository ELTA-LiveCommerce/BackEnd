import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Product } from '@/module/product/entity/product.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ProductOptionResponseDto {
  @ApiProperty({ description: '옵션명', example: '사이즈 - L' })
  name: string;

  @ApiProperty({ description: '옵션별 재고 수량', example: 10 })
  stockQuantity: number;
}

export class SellerProductResponseBodyDto {
  @ApiProperty({ description: '상품 ID', example: 'product-uuid-123' })
  id: string;

  @ApiProperty({ description: '상품명', example: '멋진 상품' })
  name: string;

  @ApiProperty({ description: '판매가', example: 35000 })
  price: number;

  @ApiProperty({ description: '재고 수량', example: 50 })
  stockQuantity: number;

  @ApiProperty({ description: '상품 간략설명', example: '정말 특별해요!', required: false })
  shortDescription?: string;

  @ApiProperty({ description: '상품 상세설명', example: '상세 설명...' })
  description: string;

  @ApiProperty({ description: '대표 이미지 URL', example: 'https://.../main.jpg', required: false })
  mainImage?: string;

  @ApiProperty({ description: '추가 이미지 URL 목록', example: ['https://.../img1.jpg'], required: false })
  images?: string[];

  @ApiProperty({ description: '판매자 ID', example: 'seller-uuid-456' })
  sellerId: string;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  @ApiProperty({ description: '상품 공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '상품 상태', example: 'DEFAULT' })
  status: string;

  @ApiProperty({
    description: '상품 옵션 목록',
    type: [ProductOptionResponseDto],
    required: false,
    example: [
      { name: '사이즈 - S', stockQuantity: 10 },
      { name: '사이즈 - M', stockQuantity: 20 },
      { name: '사이즈 - L', stockQuantity: 15 },
    ],
  })
  options?: ProductOptionResponseDto[];

  static fromEntity(product: Product): SellerProductResponseBodyDto {
    const dto = new SellerProductResponseBodyDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.price = product.price;
    
    // Calculate stock quantity from options only
    let totalStock = 0;
    if (product.options && Array.isArray(product.options)) {
      totalStock = product.options.reduce((sum, option) => sum + (option.stockQuantity || 0), 0);
    }
    dto.stockQuantity = totalStock;
    
    dto.shortDescription = product.shortDescription;
    dto.description = product.description;
    dto.mainImage = product.mainImage;
    dto.images = product.images;
    dto.sellerId = product.seller.id; // seller가 로드되었다고 가정
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    dto.isPublic = product.isPublic;
    dto.status = product.status;
    dto.options = product.options;
    return dto;
  }
}

export class SellerProductResponseDto extends BaseResponseV2<SellerProductResponseBodyDto> {
  // 성공 응답은 컨트롤러에서 BaseResponseV2.success 직접 사용
}

/**
 * 판매자 상품 목록 아이템 DTO
 */
export class SellerProductListItemDto {
  @ApiProperty({ description: '상품 ID', example: 'product-uuid-123' })
  id: string;

  @ApiProperty({ description: '상품명', example: '멋진 상품' })
  name: string;

  @ApiProperty({ description: '대표 이미지 URL', example: 'https://.../main.jpg', required: false })
  mainImage?: string;

  @ApiProperty({ description: '재고 수량', example: 50 })
  stockQuantity: number;

  @ApiProperty({ description: '판매가', example: 35000 })
  price: number;

  @ApiProperty({ description: '상품 상세설명', example: '상세 설명...' })
  description: string;

  @ApiProperty({ description: '상품 공개 여부', example: true })
  isPublic: boolean;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '상품 상태', example: 'DEFAULT' })
  status: string;

  @ApiProperty({
    description: '상품 옵션 목록',
    type: [ProductOptionResponseDto],
    required: false,
    example: [
      { name: '사이즈 - S', stockQuantity: 10 },
      { name: '사이즈 - M', stockQuantity: 20 },
      { name: '사이즈 - L', stockQuantity: 15 },
    ],
  })
  options?: ProductOptionResponseDto[];

  static fromEntity(product: Product): SellerProductListItemDto {
    const dto = new SellerProductListItemDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.mainImage = product.mainImage;
    
    // Calculate stock quantity from options only
    let totalStock = 0;
    if (product.options && Array.isArray(product.options)) {
      totalStock = product.options.reduce((sum, option) => sum + (option.stockQuantity || 0), 0);
    }
    dto.stockQuantity = totalStock;
    
    dto.price = product.price;
    dto.description = product.description;
    dto.isPublic = product.isPublic;
    dto.createdAt = product.createdAt;
    dto.status = product.status;
    dto.options = product.options;
    return dto;
  }
}

/**
 * 판매자 상품 목록 응답 DTO
 */
export class SellerProductListResponseDto extends PagedResponseV2<SellerProductListItemDto> {
  // 성공 응답은 컨트롤러에서 PagedResponseV2.create 직접 사용
}
