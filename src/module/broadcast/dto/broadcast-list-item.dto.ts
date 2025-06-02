import { Collection } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

// TODO: Define ProductListItemDto or use a simplified version
class ProductInfo {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product Name' })
  name: string;

  @ApiProperty({ description: 'Product Image URL', required: false })
  productImageUrl?: string;

  @ApiProperty({ 
    description: 'Product Options',
    example: [{ name: '사이즈 - L', stockQuantity: 10 }],
    required: false
  })
  options?: Array<{
    name: string;
    stockQuantity: number;
  }>;
}

export class BroadcastListItemDto {
  @ApiProperty({ description: 'Broadcast ID' })
  id: string;

  @ApiProperty({ description: 'Broadcast Title' })
  title: string;

  @ApiProperty({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Broadcast Status', example: 'SCHEDULED' })
  status: string;

  @ApiProperty({ description: 'Broadcast Thumbnail URL', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Scheduled Date' })
  scheduledAt: Date;

  @ApiProperty({ description: 'Associated Products', type: [ProductInfo] })
  products: ProductInfo[]; // Simplified product info for list

  isLive: boolean;

  constructor(data: Partial<BroadcastListItemDto>) {
    Object.assign(this, data);
  }

  static fromEntity(entity: any): BroadcastListItemDto {
    /* Collection → 배열 (v5, v6 공통) */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const items =
      entity.products instanceof Collection
        ? entity.products.getItems() /* 또는 .toArray() */
        : Array.isArray(entity.products)
          ? entity.products
          : [];

    return new BroadcastListItemDto({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      thumbnailUrl: entity.thumbnailUrl,
      scheduledAt: entity.scheduledAt,
      isLive: entity.isLive,
      products: items.map((bp: any) => ({
        id: bp.product?.id ?? bp.id, // BroadcastProduct → Product
        name: bp.product?.name ?? bp.name,
        productImageUrl: bp.product?.mainImage ?? bp.mainImage,
        options: bp.product?.options ?? bp.options,
      })),
    });
  }
}
