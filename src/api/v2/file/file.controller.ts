import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { AwsS3Service } from '@/module/file/aws-s3.service';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { PresignedUrlRequestDto } from './dto/presigned-url.request.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url.response.dto';

@ApiTags('v2/files')
@Controller('v2/files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileController {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @ApiOperation({ summary: 'S3 Presigned URL 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Presigned URL 생성 성공',
    type: PresignedUrlResponseDto,
  })
  @Post('presigned-url')
  async generatePresignedUrl(@Body() request: PresignedUrlRequestDto): Promise<PresignedUrlResponseDto> {
    const result = await this.awsS3Service.generatePresignedUrl({
      fileName: request.fileName,
      fileType: request.fileType,
      category: request.category,
    });

    return PresignedUrlResponseDto.create(result);
  }
}

