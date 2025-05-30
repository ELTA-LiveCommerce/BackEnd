import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationRequestDto } from '@/api/v2/common/pagination.dto';

export enum SellerUserSearchField {
  USER_ID = 'userId',
  NAME = 'name',
  LOGIN_ID = 'loginId',
}

export enum SellerUserDateField {
  CREATED_AT = 'createdAt',
  // LAST_LOGIN_AT = 'lastLoginAt', // 필요시 추가
}

export enum SellerUserStatus {
  ACTIVE = 'ACTIVE',
  CAUTION = 'CAUTION',
  BLOCKED = 'BLOCKED',
}

export class SellerUserListRequestDto extends PaginationRequestDto {
  @ApiPropertyOptional({ description: '검색 필드', enum: SellerUserSearchField })
  @IsOptional()
  @IsEnum(SellerUserSearchField)
  searchField?: SellerUserSearchField;

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @ApiPropertyOptional({ description: '사용자 상태 필터', enum: SellerUserStatus })
  @IsOptional()
  @IsEnum(SellerUserStatus)
  status?: SellerUserStatus;

  @ApiPropertyOptional({ description: '기간 필터 시작일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '기간 필터 종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '기간 필터 적용 대상 필드',
    enum: SellerUserDateField,
    default: SellerUserDateField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SellerUserDateField)
  dateField?: SellerUserDateField = SellerUserDateField.CREATED_AT;
}

export class SellerUserStatusUpdateRequestDto {
  @ApiProperty({ description: '변경할 사용자 상태', enum: SellerUserStatus })
  @IsEnum(SellerUserStatus)
  status: SellerUserStatus;

  @ApiPropertyOptional({ description: '상태 변경 사유' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SellerBusinessInfoUpdateRequestDto {
  @ApiProperty({ description: '사업자명(상호명)' })
  @IsString()
  businessName: string;

  @ApiProperty({ description: '사업자 주소' })
  @IsString()
  businessAddress: string;

  @ApiProperty({ description: '사업자 번호' })
  @IsString()
  businessNumber: string;
}

export class SellerDescriptionUpdateRequestDto {
  @ApiProperty({ description: '셀러 소개' })
  @IsString()
  description: string;
}

export class SellerOperatingHoursUpdateRequestDto {
  @ApiProperty({ description: '운영 시작 시간', example: '09:00' })
  @IsString()
  operatingStartTime: string;

  @ApiProperty({ description: '운영 종료 시간', example: '18:00' })
  @IsString()
  operatingEndTime: string;
}

export class SellerInfoUpdateRequestDto {
  @ApiProperty({ description: '사업자명(상호명)', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ description: '사업자 주소', required: false })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiProperty({ description: '사업자 번호', required: false })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiProperty({ description: '셀러 소개', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '운영 시작 시간', example: '09:00', required: false })
  @IsOptional()
  @IsString()
  operatingStartTime?: string;

  @ApiProperty({ description: '운영 종료 시간', example: '18:00', required: false })
  @IsOptional()
  @IsString()
  operatingEndTime?: string;
}
