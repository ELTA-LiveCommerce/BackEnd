import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@/module/product/entity/product.entity';

export class AdminProductResponseBody {
  @ApiProperty({ description: '상품 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  id: string;

  @ApiProperty({ description: '상품명', example: '멋진 상품' })
  name: string;

  @ApiProperty({ description: '상품 설명', example: '이 상품은 매우 멋집니다.' })
  description: string;

  @ApiProperty({ description: '판매자 ID', example: 'c6e5f7a9-3b4c-4d2e-9f8g-h1i2j3k4l5m6' })
  sellerId: string;

  @ApiProperty({ description: '가격', example: 10000 })
  price: number;

  @ApiProperty({ description: '할인 가격', example: 9000, required: false })
  discountPrice?: number;

  @ApiProperty({ description: '재고 수량', example: 100 })
  stock: number;

  @ApiProperty({ description: '카테고리', example: '의류' })
  category: string;

  @ApiProperty({ description: '이미지 URL 배열', example: ['image1.jpg', 'image2.jpg'] })
  images: string[];

  @ApiProperty({
    description: '옵션 (JSON string)',
    example: '{"colors": ["Red", "Blue"], "sizes": ["S", "M", "L"]}',
    required: false,
  })
  options?: string;

  @ApiProperty({ description: '생성일', example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Product): AdminProductResponseBody {
    const response = new AdminProductResponseBody();
    response.id = entity.id;
    response.name = entity.name;
    response.description = entity.description;
    response.sellerId = entity.seller?.id || '';
    response.price = entity.price;
    response.discountPrice = entity.discountPrice;
    response.stock = entity.stockQuantity;
    response.category = '';
    response.images = entity.images || [];
    response.options = '';
    response.createdAt = entity.createdAt;
    response.updatedAt = entity.updatedAt;
    return response;
  }
}

export class AdminProductResponse {
  @ApiProperty({ description: '응답 상태', example: true })
  success: boolean;

  @ApiProperty({ type: AdminProductResponseBody })
  data: AdminProductResponseBody;

  static fromEntity(entity: Product): AdminProductResponse {
    return {
      success: true,
      data: AdminProductResponseBody.fromEntity(entity),
    };
  }
}

export class AdminProductListResponseBody {
  @ApiProperty({ type: [AdminProductResponseBody] })
  items: AdminProductResponseBody[];

  @ApiProperty({ description: '총 아이템 수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '총 페이지 수', example: 10 })
  pages: number;

  constructor(items: AdminProductResponseBody[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.pages = Math.ceil(total / limit);
  }
}

export class AdminProductListResponse {
  @ApiProperty({ description: '응답 상태', example: true })
  success: boolean;

  @ApiProperty({ type: AdminProductListResponseBody })
  data: AdminProductListResponseBody;

  static fromResult(products: Product[], total: number, page: number, limit: number): AdminProductListResponse {
    const items = products.map((product) => AdminProductResponseBody.fromEntity(product));
    return {
      success: true,
      data: new AdminProductListResponseBody(items, total, page, limit),
    };
  }
}

