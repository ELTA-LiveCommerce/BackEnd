import { ApiProperty } from '@nestjs/swagger';
import { BroadcastProduct, BroadcastProductStatus } from '@/module/product/entity/broadcast-product.entity';

/**
 * 현재 판매 중인 상품 응답 DTO
 */
export class CurrentSellingProductDto {
  @ApiProperty({ description: '방송 상품 ID' })
  id: string;

  @ApiProperty({ description: '상품 ID' })
  productId: string;

  @ApiProperty({ description: '상품명' })
  productName: string;

  @ApiProperty({ description: '상품 이미지 URL', required: false })
  productImage?: string;

  @ApiProperty({ description: '상품 가격' })
  price: number;

  @ApiProperty({ description: '방송 특별가', required: false })
  specialPrice?: number;

  @ApiProperty({ description: '상품 상태', enum: BroadcastProductStatus })
  status: BroadcastProductStatus;

  @ApiProperty({ description: '상품 정렬 순서' })
  sortOrder: number;

  @ApiProperty({ description: '방송에서 판매된 수량' })
  soldQuantity: number;

  @ApiProperty({ description: '방송 상품 설명', required: false })
  broadcastDescription?: string;

  /**
   * BroadcastProduct 엔티티로부터 DTO 생성
   */
  static fromEntity(broadcastProduct: BroadcastProduct): CurrentSellingProductDto | null {
    if (!broadcastProduct) return null;

    const dto = new CurrentSellingProductDto();
    dto.id = broadcastProduct.id;
    dto.productId = broadcastProduct.product.id;
    dto.productName = broadcastProduct.product.name;
    dto.productImage = broadcastProduct.product.mainImage;
    dto.price = broadcastProduct.product.price;
    dto.specialPrice = broadcastProduct.specialPrice;
    dto.status = broadcastProduct.status;
    dto.sortOrder = broadcastProduct.sortOrder;
    dto.soldQuantity = broadcastProduct.soldQuantity;
    dto.broadcastDescription = broadcastProduct.broadcastDescription;

    return dto;
  }
}

/**
 * 현재 판매 중인 상품 변경 요청 DTO
 */
export class UpdateCurrentSellingProductDto {
  @ApiProperty({ description: '판매할 상품 ID' })
  productId: string;
}

/**
 * 방송 상품 목록 응답 DTO
 */
export class BroadcastProductsResponseDto {
  @ApiProperty({ description: '방송 상품 목록', type: [CurrentSellingProductDto] })
  items: CurrentSellingProductDto[];

  /**
   * BroadcastProduct 엔티티 배열로부터 DTO 생성
   */
  static fromEntities(broadcastProducts: BroadcastProduct[]): BroadcastProductsResponseDto {
    const dto = new BroadcastProductsResponseDto();
    dto.items = broadcastProducts
      .map((bp) => CurrentSellingProductDto.fromEntity(bp))
      .filter((item): item is CurrentSellingProductDto => item !== undefined);
    return dto;
  }
}

