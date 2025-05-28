import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class PresignedUrlRequestDto {
  @ApiProperty({ description: '파일명', example: 'image.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: '파일 타입 (MIME type)', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({
    description: '파일 카테고리 (저장될 폴더명)',
    example: 'products',
    required: false,
    default: 'general',
  })
  @IsString()
  @IsOptional()
  category?: string;
}

