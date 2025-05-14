import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class ChatTokenDto {
  @IsString() uid!: string;

  @IsInt()
  @Min(60)
  @IsOptional()
  ttl?: number = 3600;
}
