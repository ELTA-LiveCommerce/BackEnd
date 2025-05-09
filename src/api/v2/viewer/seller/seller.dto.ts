import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

/**
 * 셀러 검색 요청 DTO
 */
export class SellerSearchRequestDto {
  @IsNotEmpty()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 셀러 검색 결과 아이템 DTO
 */
export class SellerSearchItemDto {
  id: string;
  username: string;
  name: string;
  profileImage?: string;
}

/**
 * 셀러 검색 결과 응답 DTO
 */
export class SellerSearchResponseDto extends BaseResponseV2<SellerSearchItemDto[]> {
  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = '판매자 검색 결과입니다.', statusCode = 200): BaseResponseV2<T> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}

/**
 * 셀러 정보 요청 DTO
 * sellerId는 URL 경로 파라미터로 받으므로 별도의 필드가 필요하지 않습니다.
 */
export class SellerInfoRequestDto {
  // sellerId는 URL 경로 파라미터로 받음
}

/**
 * 셀러 정보 응답 DTO
 */
export class SellerInfoDto {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  description?: string;
  followers?: number;
  following?: number;
}

/**
 * 셀러 정보 응답 DTO
 */
export class SellerInfoResponseDto extends BaseResponseV2<SellerInfoDto> {
  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = '셀러 정보입니다.', statusCode = 200): BaseResponseV2<T> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}

/**
 * 페이지네이션 요청 DTO
 */
export class PaginationRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 셀러 라이브 요청 DTO
 */
export class SellerLiveRequestDto extends PaginationRequestDto {
  // sellerId는 URL 경로 파라미터로 받음
}

/**
 * 셀러 라이브 아이템 DTO
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
 * 셀러 라이브 페이지 응답 DTO
 */
export class SellerLivePageDto {
  items: SellerLiveItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 셀러 라이브 응답 DTO
 */
export class SellerLiveResponseDto extends BaseResponseV2<SellerLivePageDto> {
  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = '셀러 라이브 목록입니다.', statusCode = 200): BaseResponseV2<T> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}

/**
 * 셀러 상품 요청 DTO
 */
export class SellerProductRequestDto extends PaginationRequestDto {
  // sellerId는 URL 경로 파라미터로 받음
}

/**
 * 셀러 상품 아이템 DTO
 */
export class SellerProductItemDto {
  id: string;
  name: string;
  price: number;
  thumbnailImage?: string;
  description?: string;
  stock: number;
  salesCount: number;
  rating?: number;
}

/**
 * 셀러 상품 페이지 응답 DTO
 */
export class SellerProductPageDto {
  items: SellerProductItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 셀러 상품 응답 DTO
 */
export class SellerProductResponseDto extends BaseResponseV2<SellerProductPageDto> {
  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = '셀러 상품 목록입니다.', statusCode = 200): BaseResponseV2<T> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}
