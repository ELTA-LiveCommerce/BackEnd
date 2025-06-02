import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class BroadcastUpdateRequestDto {
  @ApiPropertyOptional({
    description: '방송 제목',
    example: '특별 할인 라이브 방송!',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '방송 설명',
    example: '이번 방송에서는 특별 할인 상품을 소개합니다.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '방송 예정 날짜 (ISO 8601 형식)',
    example: '2024-08-15T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: '방송에서 판매할 상품 ID 목록',
    example: ['product-uuid-1', 'product-uuid-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({
    description: '방송 대표 이미지 URL',
    example: 'https://example.com/broadcast-thumbnail.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailImageUrl?: string;
}