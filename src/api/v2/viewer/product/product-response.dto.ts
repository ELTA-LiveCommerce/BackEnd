import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { ApiProperty } from '@nestjs/swagger';

// 판매자 정보 (간략)
class ProductSellerInfo {
  id!: string;
  name!: string; // 또는 nickname
  // profileImage?: string;

  static fromUserEntity(seller: User): ProductSellerInfo {
    const info = new ProductSellerInfo();
    info.id = seller.id;
    info.name = seller.name; // User 엔티티에 nickname 필드가 있다면 그것을 우선적으로 사용
    return info;
  }
}

export class ViewerProductSellerDto {
  @ApiProperty({ description: '판매자 ID', example: 'seller-uuid' })
  id: string;

  @ApiProperty({ description: '판매자 이름', example: '판매자1' })
  name: string;

  @ApiProperty({ description: '판매자 프로필 이미지 URL', example: 'https://example.com/profile.jpg', required: false })
  profileImage?: string;

  static fromEntity(seller: Product['seller']): ViewerProductSellerDto {
    return {
      id: seller.id,
      name: seller.name || seller.loginId, // 이름이 없으면 loginId 사용
      profileImage: seller.profileImage,
    };
  }
}

/**
 * 뷰어 상품 목록/상세 조회를 위한 응답 바디 DTO
 */
export class ViewerProductResponseBodyDto {
  @ApiProperty({ description: '상품 ID', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ description: '상품명', example: '멋진 신발' })
  name: string;

  @ApiProperty({ description: '가격', example: 29900 })
  price: number;

  @ApiProperty({ description: '메인 이미지 URL', example: 'https://example.com/image.jpg', required: false })
  mainImage?: string;

  @ApiProperty({ description: '짧은 설명', example: '정말 편하고 예뻐요!', required: false })
  shortDescription?: string;

  @ApiProperty({ description: '재고 수량', example: 100 })
  stockQuantity: number;

  @ApiProperty({ description: '상품 상세 이미지', example: 'https://example.com/image1.jpg', required: false })
  images?: string[];

  @ApiProperty({ description: '판매자 정보' })
  seller: ViewerProductSellerDto;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  static fromEntity(product: Product): ViewerProductResponseBodyDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      mainImage: product.mainImage,
      shortDescription: product.shortDescription,
      stockQuantity: product.stockQuantity,
      seller: ViewerProductSellerDto.fromEntity(product.seller),
      images: product.images,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

/**
 * 뷰어 특정 상품 상세 조회 응답 DTO
 */
export class ViewerProductResponseDto extends BaseResponseV2<ViewerProductResponseBodyDto> {
  // success 메서드 제거
}

/**
 * 뷰어 상품 목록 조회 응답 DTO
 */
export class ViewerProductListResponseDto extends PagedResponseV2<ViewerProductResponseBodyDto> {
  // success 메서드 제거

  /**
   * 페이지네이션된 성공 응답 생성
   * @param items 항목 배열
   * @param total 전체 항목 수
   * @param page 현재 페이지
   * @param limit 페이지당 항목 수
   * @param message 응답 메시지
   */
  static createPaged(
    items: ViewerProductResponseBodyDto[],
    total: number,
    page: number,
    limit: number,
    message = '상품 목록 조회 성공',
  ): ViewerProductListResponseDto {
    // PagedResponseV2.create 사용
    return PagedResponseV2.create(items, total, page, limit, message);
  }
}
