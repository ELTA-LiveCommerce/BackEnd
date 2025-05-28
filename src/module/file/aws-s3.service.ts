import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  category?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
  expiresIn: number;
}

@Injectable()
export class AwsS3Service {
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-northeast-2';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME 환경변수가 설정되지 않았습니다.');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS 자격 증명이 설정되지 않았습니다.');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Presigned URL 생성
   */
  async generatePresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    try {
      const { fileName, fileType, category = 'general' } = request;

      // 고유한 파일 키 생성
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const key = `${category}/${uniqueFileName}`;

      // PutObject 명령 생성
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType,
      });

      // Presigned URL 생성 (15분 유효)
      const expiresIn = 15 * 60; // 15분
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      // 업로드 완료 후 접근할 수 있는 파일 URL
      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`Presigned URL 생성 완료: ${key}`);

      return {
        uploadUrl,
        key,
        fileUrl,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Presigned URL 생성 실패:', error);
      throw new Error('Presigned URL 생성에 실패했습니다.');
    }
  }
}

