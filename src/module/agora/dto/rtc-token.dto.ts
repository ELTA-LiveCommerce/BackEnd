import { IsString, IsNumberString, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class RtcTokenDto {
  @IsString() channel!: string;
  @IsNumberString() uid!: string;
  @IsIn(['publisher', 'subscriber'])
  @IsOptional()
  role?: 'publisher' | 'subscriber' = 'publisher';

  @IsInt()
  @Min(60)
  @IsOptional()
  ttl?: number = 3600;
}
