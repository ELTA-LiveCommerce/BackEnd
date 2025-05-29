import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Product, ProductStatus } from '@/module/product/entity/product.entity';
import { ProductService } from '@/module/product/product.service';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 판매자 검색 결과 항목 DTO
 */
export class SellerSearchItemDto {
  id: string;
  username: string;
  name: string;
  profileImage?: string;
}

/**
 * 판매자 검색 응답 DTO
 */
export class SellerSearchResponseDto extends BaseResponseV2<SellerSearchItemDto[]> {
  // success 메서드 제거
}

/**
 * 판매자 정보 DTO
 */
export class SellerInfoDto {
  id: string;
  name: string;
  loginId: string;
  profileImage?: string;
  bannerImage?: string;
  description?: string;
  followers: number;
  following: number;
  isFollowing: boolean;

  // 셀러 비즈니스 정보 추가
  @ApiProperty({ example: 'ABC 상사', description: '상호명', required: false })
  businessName?: string;

  @ApiProperty({ example: '서울시 강남구 테헤란로 123', description: '사업자주소', required: false })
  businessAddress?: string;

  @ApiProperty({ example: '123-45-67890', description: '사업자번호', required: false })
  businessNumber?: string;
}

/**
 * 판매자 정보 응답 DTO
 */
export class SellerInfoResponseDto extends BaseResponseV2<SellerInfoDto> {
  // success 메서드 제거
}

/**
 * 판매자 팔로우 응답 DTO
 */
export class SellerFollowResponseDto extends BaseResponseV2<{ isFollowing: boolean }> {
  // success 메서드 제거
}

/**
 * 판매자 라이브 방송 항목 DTO
 */
export class SellerLiveItemDto {
  id: string;
  title: string;
  thumbnailImage?: string;
  viewerCount: number;
  startedAt: Date;
  status: string;
  isLive: boolean;

  static fromEntity(broadcast: Broadcast): SellerLiveItemDto {
    const dto = new SellerLiveItemDto();
    dto.id = broadcast.id;
    dto.title = broadcast.title;
    dto.thumbnailImage = broadcast.thumbnailUrl;
    dto.viewerCount = 0; // 실시간 시청자 수는 별도 API로 조회 필요
    dto.isLive = broadcast.isLive;
    dto.startedAt = broadcast.scheduledAt;
    dto.status = broadcast.isLive ? 'LIVE' : 'SCHEDULED';
    return dto;
  }
}

/**
 * 판매자 라이브 방송 페이지 DTO
 */
export class SellerLivePageDto {
  items: SellerLiveItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 판매자 라이브 방송 응답 DTO
 */
export class SellerLiveResponseDto extends BaseResponseV2<SellerLiveItemDto[]> {
  // success 메서드 제거
}

/**
 * 판매자 상품 항목 DTO
 */
export class SellerProductItemDto {
  id: string;
  name: string;
  price: number;
  thumbnailImage?: string;
  shortDescription?: string;
  description?: string;
  stock: number;
  salesCount: number;
  status: ProductStatus;

  static async fromEntity(product: Product, salesCount: number): Promise<SellerProductItemDto> {
    const dto = new SellerProductItemDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.price = product.price;
    dto.thumbnailImage = product.mainImage;
    dto.shortDescription = product.shortDescription;
    dto.description = product.description;
    dto.stock = product.stockQuantity;
    dto.status = product.status;

    // 판매량 구현
    dto.salesCount = salesCount;

    return dto;
  }
}

/**
 * 판매자 상품 페이지 DTO
 */
export class SellerProductPageDto {
  items: SellerProductItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 판매자 상품 응답 DTO
 */
export class SellerProductResponseDto extends BaseResponseV2<SellerProductItemDto[]> {
  // success 메서드 제거
}

