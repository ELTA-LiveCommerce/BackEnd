import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { UserRole } from '@/shared/enum/user-role.enum';

export class AutocompleteDto {
  @IsString()
  query: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number = 5;
}

export class AutocompleteResultDto {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}
