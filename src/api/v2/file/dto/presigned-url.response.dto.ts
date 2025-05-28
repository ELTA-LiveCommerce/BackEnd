import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

export class PresignedUrlData {
  @ApiProperty({ description: '업로드 URL', example: 'https://your-bucket.s3.amazonaws.com/...' })
  uploadUrl: string;

  @ApiProperty({ description: 'S3 키', example: 'products/uuid.jpg' })
  key: string;

  @ApiProperty({
    description: '업로드 완료 후 파일 접근 URL',
    example: 'https://your-bucket.s3.amazonaws.com/products/uuid.jpg',
  })
  fileUrl: string;

  @ApiProperty({ description: 'URL 만료 시간 (초)', example: 900 })
  expiresIn: number;
}

export class PresignedUrlResponseDto extends BaseResponseV2<PresignedUrlData> {
  static create(data: PresignedUrlData): PresignedUrlResponseDto {
    return {
      success: true,
      statusCode: 200,
      message: 'Presigned URL 생성 성공',
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

