import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UserSearchDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
