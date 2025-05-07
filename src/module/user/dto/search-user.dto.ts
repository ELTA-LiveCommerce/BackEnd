import { Type } from 'class-transformer';
import { IsOptional, IsString, Min, IsInt, IsEnum } from 'class-validator';

import { UserRole } from '@/shared/enum/user-role.enum';

export class SearchUserDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}

export class UserSearchResultDto {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: UserRole;
  isFollowing: boolean;
}

export class PaginatedSearchResultDto {
  items: UserSearchResultDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
