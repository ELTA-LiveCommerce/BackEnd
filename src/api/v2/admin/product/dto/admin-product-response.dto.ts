import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@/module/product/entity/product.entity';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

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

export class AdminProductResponse extends BaseResponseV2<AdminProductResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({ description: '상품 상세 정보', type: AdminProductResponseBody })
  declare data: AdminProductResponseBody;

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromEntity(entity: Product): AdminProductResponse {
    const body = AdminProductResponseBody.fromEntity(entity);
    return BaseResponseV2.success(body);
  }
}

export class AdminProductListResponse extends PagedResponseV2<AdminProductResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 상품 목록 데이터',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminProductResponseBody' } },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminProductResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromResult(products: Product[], total: number, page: number, limit: number): AdminProductListResponse {
    const items = products.map((product) => AdminProductResponseBody.fromEntity(product));
    return new AdminProductListResponse(items, total, page, limit);
  }
}

