import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/shared/enum/user-role.enum';

export enum AdminUserSortBy {
  NAME = 'name',
  PHONE_NUMBER = 'phoneNumber',
  CREATED_AT = 'createdAt',
  ROLE = 'role',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class AdminUserListRequest {
  @ApiProperty({ description: '페이지 번호', example: 1, default: 1, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: '페이지당 항목 수', example: 10, default: 10, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ enum: UserRole, description: '사용자 역할로 필터링', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: '검색어 (이름, 이메일, 닉네임)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: AdminUserSortBy,
    default: AdminUserSortBy.CREATED_AT,
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminUserSortBy)
  sortBy?: AdminUserSortBy = AdminUserSortBy.CREATED_AT;

  @ApiProperty({
    description: '정렬 방향',
    enum: SortOrder,
    default: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class AdminCreateUserRequest {
  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: UserRole, description: '사용자 역할', example: UserRole.VIEWER })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: '전화번호', example: '01012345678', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class AdminUpdateUserRequest {
  @ApiProperty({ description: '이메일 주소', example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '비밀번호', example: 'password123', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '사용자 닉네임', example: 'gildong', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ enum: UserRole, description: '사용자 역할', example: UserRole.VIEWER, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: '전화번호', example: '01012345678', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

