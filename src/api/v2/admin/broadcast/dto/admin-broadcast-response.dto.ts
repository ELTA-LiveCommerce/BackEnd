import { ApiProperty } from '@nestjs/swagger';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';

export class AdminBroadcastProductResponse {
  @ApiProperty({ description: '상품 ID' })
  id: string;

  @ApiProperty({ description: '상품 이미지 URL' })
  imageUrl: string;

  @ApiProperty({ description: '상품명' })
  name: string;

  @ApiProperty({ description: '재고 수량' })
  stockQuantity: number;

  @ApiProperty({ description: '가격' })
  price: number;

  static fromBroadcastProduct(broadcastProduct: BroadcastProduct): AdminBroadcastProductResponse {
    return {
      id: broadcastProduct.product.id,
      imageUrl: broadcastProduct.product.mainImage || '',
      name: broadcastProduct.product.name,
      stockQuantity: broadcastProduct.product.stockQuantity,
      price: broadcastProduct.product.price,
    };
  }
}

export class AdminBroadcastResponseBody {
  @ApiProperty({ description: '방송 ID' })
  id: string;

  @ApiProperty({ description: '방송 제목' })
  title: string;

  @ApiProperty({ description: '판매자 ID' })
  sellerId: string;

  @ApiProperty({ description: '판매자 이름' })
  sellerName: string;

  @ApiProperty({ description: '예약 시간' })
  scheduledAt: Date;

  @ApiProperty({ description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ description: '썸네일 URL' })
  thumbnailUrl?: string;

  @ApiProperty({ description: '라이브 여부' })
  isLive: boolean;

  @ApiProperty({ description: '최대 시청자 수' })
  maxViewers: number;

  @ApiProperty({ description: '현재 시청자 수' })
  currentViewers: number;

  @ApiProperty({ description: '상품 목록', type: [AdminBroadcastProductResponse] })
  products: AdminBroadcastProductResponse[];

  static fromEntity(broadcast: Broadcast): AdminBroadcastResponseBody {
    return {
      id: broadcast.id,
      title: broadcast.title,
      sellerId: broadcast.seller.id,
      sellerName: broadcast.seller.name,
      scheduledAt: broadcast.scheduledAt,
      createdAt: broadcast.createdAt,
      thumbnailUrl: broadcast.thumbnailUrl,
      isLive: broadcast.isLive,
      maxViewers: broadcast.maxViewers || 0,
      currentViewers: 0, // 실시간 시청자 수는 별도 API (GET /admin/broadcasts/:id/viewers)로 조회
      products: broadcast.products
        ? broadcast.products.getItems().map(AdminBroadcastProductResponse.fromBroadcastProduct)
        : [],
    };
  }
}

export class AdminBroadcastResponse extends BaseResponseV2<AdminBroadcastResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({ description: '방송 상세 정보', type: AdminBroadcastResponseBody })
  declare data: AdminBroadcastResponseBody;

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromEntity(broadcast: Broadcast): AdminBroadcastResponse {
    const body = AdminBroadcastResponseBody.fromEntity(broadcast);
    return BaseResponseV2.success(body);
  }
}

export class AdminBroadcastListResponse extends PagedResponseV2<AdminBroadcastResponseBody> {
  @ApiProperty({ description: '성공 여부', example: true })
  declare success: boolean;

  @ApiProperty({ description: 'HTTP 상태 코드', example: 200 })
  declare statusCode: number;

  @ApiProperty({ description: '응답 메시지', example: '요청 성공' })
  declare message: string;

  @ApiProperty({
    description: '페이지네이션된 방송 목록 데이터',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminBroadcastResponseBody' } },
      total: { type: 'number', description: '전체 항목 수' },
      page: { type: 'number', description: '현재 페이지 번호' },
      limit: { type: 'number', description: '페이지당 항목 수' },
      totalPages: { type: 'number', description: '전체 페이지 수' },
    },
  })
  declare data: {
    items: AdminBroadcastResponseBody[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ description: '응답 타임스탬프', example: '2024-05-12T14:30:00Z' })
  declare timestamp: string;

  static fromResult(broadcasts: Broadcast[], total: number, page: number, limit: number): AdminBroadcastListResponse {
    const items = broadcasts.map(AdminBroadcastResponseBody.fromEntity);
    return new AdminBroadcastListResponse(items, total, page, limit);
  }
}

