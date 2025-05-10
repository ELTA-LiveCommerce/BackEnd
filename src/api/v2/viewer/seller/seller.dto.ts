import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Min, IsInt } from 'class-validator';

import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

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
  /**
   * 성공 응답 생성
   */
  static success(
    data: SellerSearchItemDto[],
    message = '판매자 검색 결과입니다.',
    statusCode = 200,
  ): BaseResponseV2<SellerSearchItemDto[]> {
    return BaseResponseV2.success(data, message, statusCode);
  }
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
  email: string;
  profileImage?: string;
  description?: string;
  followers: number;
  following: number;
}

/**
 * 판매자 정보 응답 DTO
 */
export class SellerInfoResponseDto extends BaseResponseV2<SellerInfoDto> {
  /**
   * 성공 응답 생성
   */
  static success(data: SellerInfoDto, message = '판매자 정보입니다.', statusCode = 200): BaseResponseV2<SellerInfoDto> {
    return BaseResponseV2.success(data, message, statusCode);
  }
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
export class SellerLiveResponseDto extends BaseResponseV2<SellerLivePageDto> {
  /**
   * 성공 응답 생성
   */
  static success(
    data: SellerLivePageDto,
    message = '판매자 라이브 방송 목록입니다.',
    statusCode = 200,
  ): BaseResponseV2<SellerLivePageDto> {
    return BaseResponseV2.success(data, message, statusCode);
  }
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
export class SellerProductResponseDto extends BaseResponseV2<SellerProductPageDto> {
  /**
   * 성공 응답 생성
   */
  static success(
    data: SellerProductPageDto,
    message = '판매자 상품 목록입니다.',
    statusCode = 200,
  ): BaseResponseV2<SellerProductPageDto> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}
