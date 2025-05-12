import { ApiProperty } from '@nestjs/swagger';

import { Product } from '../entity/product.entity';

export class SellerProductListItemDto {
  @ApiProperty({ description: '상품 ID', example: 'clx1y2z3a0000b1c2d3e4f5g' })
  id: string;

  @ApiProperty({ description: '상품명', example: '캠핑용 텐트' })
  name: string;

  @ApiProperty({ description: '상품 가격', example: 150000 })
  price: number;

  @ApiProperty({ description: '상품 재고', example: 50 })
  stockQuantity: number;

  @ApiProperty({ description: '등록일시', example: '2023-12-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2023-12-05T15:30:00.000Z' })
  updatedAt: Date;

  static fromEntity(product: Product): SellerProductListItemDto {
    const dto = new SellerProductListItemDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.price = product.price;
    dto.stockQuantity = product.stockQuantity;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}
