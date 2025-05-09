import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

/**
 * 셀러 검색 요청 DTO
 */
export class SellerSearchRequestDto {
  @IsNotEmpty()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsString()
  limit?: string;
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
   * BaseResponseV2의 static success 메서드와 시그니처를 일치시키기 위해 일반화된 메서드로 수정
   */
  static success<T>(data: T, message = '판매자 검색 결과입니다.', statusCode = 200): BaseResponseV2<T> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}
