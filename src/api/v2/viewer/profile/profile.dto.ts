import { IsOptional, IsString } from 'class-validator';

import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

/**
 * 프로필 정보 DTO
 */
export class ProfileDto {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  shippingAddress?: string;
  profileImage?: string;
}

/**
 * 프로필 정보 응답 DTO
 */
export class ProfileResponseDto extends BaseResponseV2<ProfileDto> {
  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = '프로필 정보입니다.', statusCode = 200): BaseResponseV2<T> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}

/**
 * 프로필 정보 업데이트 요청 DTO
 */
export class UpdateProfileRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;
}

/**
 * 프로필 조회 요청 DTO
 */
export class ProfileInfoRequestDto {
  // 필요한 경우 쿼리 파라미터 추가
}

/**
 * 배송지 정보 DTO
 */
export class DeliveryAddressDto {
  id: string;
  address: string;
  detailAddress: string;
  postalCode: string;
  receiverName: string;
  receiverPhone: string;
  isDefault: boolean;
}

/**
 * 프로필 정보 DTO (확장)
 */
export class ProfileInfoDto {
  id: string;
  name: string;
  loginId: string;
  phoneNumber: string;
  bankAccount: string;
  bankName: string;
  deliveryAddresses: DeliveryAddressDto[];
}

/**
 * 프로필 조회 응답 DTO
 */
export class ProfileInfoResponseDto extends BaseResponseV2<ProfileInfoDto> {
  /**
   * 성공 응답 생성
   */
  static success(
    data: ProfileInfoDto,
    message = '프로필 정보입니다.',
    statusCode = 200,
  ): BaseResponseV2<ProfileInfoDto> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}

/**
 * 배송지 업데이트 요청 DTO
 */
export class UpdateDeliveryAddressRequestDto {
  @IsString()
  address: string;

  @IsString()
  detailAddress: string;

  @IsString()
  postalCode: string;

  @IsString()
  receiverName: string;

  @IsString()
  receiverPhone: string;

  @IsOptional()
  isDefault?: boolean;
}

/**
 * 배송지 생성 요청 DTO
 */
export class CreateDeliveryAddressRequestDto {
  @IsString()
  address: string;

  @IsString()
  detailAddress: string;

  @IsString()
  postalCode: string;

  @IsString()
  receiverName: string;

  @IsString()
  receiverPhone: string;

  @IsOptional()
  isDefault?: boolean;
}

/**
 * 배송지 조회 파라미터 DTO
 */
export class DeliveryAddressRequestDto {
  // 필요한 경우 쿼리 파라미터 추가
}

/**
 * 배송지 응답 DTO
 */
export class DeliveryAddressResponseDto extends BaseResponseV2<DeliveryAddressDto> {
  /**
   * 성공 응답 생성
   */
  static success(
    data: DeliveryAddressDto,
    message = '배송지 정보입니다.',
    statusCode = 200,
  ): BaseResponseV2<DeliveryAddressDto> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}

/**
 * 배송지 목록 응답 DTO
 */
export class DeliveryAddressListResponseDto extends BaseResponseV2<DeliveryAddressDto[]> {
  /**
   * 성공 응답 생성
   */
  static success(
    data: DeliveryAddressDto[],
    message = '배송지 목록입니다.',
    statusCode = 200,
  ): BaseResponseV2<DeliveryAddressDto[]> {
    return BaseResponseV2.success(data, message, statusCode);
  }
}
