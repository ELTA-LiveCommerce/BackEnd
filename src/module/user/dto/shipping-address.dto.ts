import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * 배송지 정보 생성 DTO
 */
export class CreateShippingAddressDto {
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  detailAddress?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

/**
 * 배송지 정보 수정 DTO
 */
export class UpdateShippingAddressDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  detailAddress?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
