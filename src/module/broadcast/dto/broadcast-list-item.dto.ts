import { ApiProperty } from '@nestjs/swagger';

// TODO: Define ProductListItemDto or use a simplified version
class ProductInfo {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product Name' })
  name: string;
}

export class BroadcastListItemDto {
  @ApiProperty({ description: 'Broadcast ID' })
  id: string;

  @ApiProperty({ description: 'Broadcast Title' })
  title: string;

  @ApiProperty({ description: 'Broadcast Thumbnail URL', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Scheduled Date' })
  scheduledAt: Date;

  @ApiProperty({ description: 'Associated Products', type: [ProductInfo] })
  products: ProductInfo[]; // Simplified product info for list

  constructor(data: Partial<BroadcastListItemDto>) {
    Object.assign(this, data);
  }
}
