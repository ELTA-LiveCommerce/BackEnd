import { ApiProperty } from '@nestjs/swagger';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';

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

export class AdminBroadcastResponse {
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

  @ApiProperty({ description: '상품 목록', type: [AdminBroadcastProductResponse] })
  products: AdminBroadcastProductResponse[];

  static fromEntity(broadcast: Broadcast): AdminBroadcastResponse {
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
      products: broadcast.products.isInitialized()
        ? broadcast.products.getItems().map(AdminBroadcastProductResponse.fromBroadcastProduct)
        : [],
    };
  }
}

export class AdminBroadcastListResponse {
  @ApiProperty({ description: '응답 데이터' })
  data: {
    items: AdminBroadcastResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  static fromResult(broadcasts: Broadcast[], total: number, page: number, limit: number): AdminBroadcastListResponse {
    const totalPages = Math.ceil(total / limit);
    return {
      data: {
        items: broadcasts.map(AdminBroadcastResponse.fromEntity),
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
