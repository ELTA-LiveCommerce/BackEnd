import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Min, IsInt } from 'class-validator';

import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Product } from '@/module/product/entity/product.entity';

/**
 * 판매자 검색 요청 DTO
 */
export class SellerSearchRequestDto {
  @IsNotEmpty()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

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
 * 판매자 정보 요청 DTO
 */
export class SellerInfoRequestDto {
  // 필요한 경우 쿼리 파라미터 추가
}

/**
 * 판매자 정보 DTO
 */
export class SellerInfoDto {
  id: string;
  name: string;
  loginId: string;
  profileImage?: string;
  description?: string;
  followers: number;
  following: number;
}

/**
 * 판매자 정보 응답 DTO
 */
export class SellerInfoResponseDto extends BaseResponseV2<SellerInfoDto> {
  // success 메서드 제거
}

/**
 * 판매자 라이브 방송 요청 DTO
 */
export class SellerLiveRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
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

  static fromEntity(broadcast: Broadcast): SellerLiveItemDto {
    const dto = new SellerLiveItemDto();
    dto.id = broadcast.id;
    dto.title = broadcast.title;
    dto.thumbnailImage = broadcast.thumbnailImage;
    dto.viewerCount = 0; // 실제 구현 필요
    dto.startedAt = broadcast.scheduledDate;
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
 * 판매자 상품 요청 DTO
 */
export class SellerProductRequestDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 판매자 상품 항목 DTO
 */
export class SellerProductItemDto {
  id: string;
  name: string;
  price: number;
  thumbnailImage?: string;
  description?: string;
  stock: number;
  salesCount: number;
  rating: number;

  static fromEntity(product: Product): SellerProductItemDto {
    const dto = new SellerProductItemDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.price = product.price;
    dto.thumbnailImage = product.mainImage;
    dto.description = product.shortDescription;
    dto.stock = product.stockQuantity;
    dto.salesCount = 0; // 실제 구현 필요
    dto.rating = 0; // 실제 구현 필요
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
