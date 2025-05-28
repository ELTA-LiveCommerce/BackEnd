import { Test, TestingModule } from '@nestjs/testing';
import { AwsS3Service, PresignedUrlRequest } from './aws-s3.service';
import { Logger } from '@nestjs/common';

// AWS SDK 모킹
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('AwsS3Service', () => {
  let service: AwsS3Service;

  const originalEnv = process.env;

  beforeEach(async () => {
    // 환경변수 설정
    process.env = {
      ...originalEnv,
      AWS_REGION: 'ap-northeast-2',
      AWS_S3_BUCKET_NAME: 'test-bucket',
      AWS_ACCESS_KEY_ID: 'test-access-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsS3Service],
    }).compile();

    service = module.get<AwsS3Service>(AwsS3Service);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when AWS_S3_BUCKET_NAME is not set', () => {
      delete process.env.AWS_S3_BUCKET_NAME;

      expect(() => {
        new AwsS3Service();
      }).toThrow('AWS_S3_BUCKET_NAME 환경변수가 설정되지 않았습니다.');
    });

    it('should throw error when AWS credentials are not set', () => {
      delete process.env.AWS_ACCESS_KEY_ID;

      expect(() => {
        new AwsS3Service();
      }).toThrow('AWS 자격 증명이 설정되지 않았습니다.');
    });

    it('should throw error when AWS_SECRET_ACCESS_KEY is not set', () => {
      delete process.env.AWS_SECRET_ACCESS_KEY;

      expect(() => {
        new AwsS3Service();
      }).toThrow('AWS 자격 증명이 설정되지 않았습니다.');
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL successfully', async () => {
      // Given
      const request: PresignedUrlRequest = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        category: 'products',
      };

      const mockUploadUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUploadUrl);

      // When
      const result = await service.generatePresignedUrl(request);

      // Then
      expect(result).toEqual({
        uploadUrl: mockUploadUrl,
        key: expect.stringMatching(/^products\/[0-9a-f-]{36}\.jpg$/),
        fileUrl: expect.stringMatching(
          /^https:\/\/test-bucket\.s3\.ap-northeast-2\.amazonaws\.com\/products\/[0-9a-f-]{36}\.jpg$/,
        ),
        expiresIn: 900,
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object), // S3Client instance
        expect.any(Object), // PutObjectCommand instance
        { expiresIn: 900 },
      );
    });

    it('should use default category when not provided', async () => {
      // Given
      const request: PresignedUrlRequest = {
        fileName: 'test.png',
        fileType: 'image/png',
      };

      const mockUploadUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUploadUrl);

      // When
      const result = await service.generatePresignedUrl(request);

      // Then
      expect(result.key).toMatch(/^general\/[0-9a-f-]{36}\.png$/);
      expect(result.fileUrl).toMatch(
        /^https:\/\/test-bucket\.s3\.ap-northeast-2\.amazonaws\.com\/general\/[0-9a-f-]{36}\.png$/,
      );
    });

    it('should handle file without extension', async () => {
      // Given
      const request: PresignedUrlRequest = {
        fileName: 'testfile',
        fileType: 'text/plain',
        category: 'documents',
      };

      const mockUploadUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUploadUrl);

      // When
      const result = await service.generatePresignedUrl(request);

      // Then
      expect(result.key).toMatch(/^documents\/[0-9a-f-]{36}\.testfile$/);
    });

    it('should throw error when getSignedUrl fails', async () => {
      // Given
      const request: PresignedUrlRequest = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        category: 'products',
      };

      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('AWS Error'));

      // When & Then
      await expect(service.generatePresignedUrl(request)).rejects.toThrow('Presigned URL 생성에 실패했습니다.');
    });

    it('should handle different file types correctly', async () => {
      // Given
      const requests = [
        { fileName: 'document.pdf', fileType: 'application/pdf', category: 'docs' },
        { fileName: 'video.mp4', fileType: 'video/mp4', category: 'videos' },
        { fileName: 'audio.mp3', fileType: 'audio/mpeg', category: 'audio' },
      ];

      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValue('https://test-bucket.s3.amazonaws.com/presigned-url');

      // When & Then
      for (const request of requests) {
        const result = await service.generatePresignedUrl(request);

        expect(result.key).toMatch(new RegExp(`^${request.category}/[0-9a-f-]{36}\\.`));
        expect(result.uploadUrl).toBe('https://test-bucket.s3.amazonaws.com/presigned-url');
        expect(result.expiresIn).toBe(900);
      }
    });
  });

  describe('logger', () => {
    it('should log success message when presigned URL is generated', async () => {
      // Given
      const loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const request: PresignedUrlRequest = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        category: 'products',
      };

      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValue('https://test-bucket.s3.amazonaws.com/presigned-url');

      // When
      await service.generatePresignedUrl(request);

      // Then
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Presigned URL 생성 완료: products\/[0-9a-f-]{36}\.jpg$/),
      );

      loggerSpy.mockRestore();
    });

    it('should log error message when presigned URL generation fails', async () => {
      // Given
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const request: PresignedUrlRequest = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        category: 'products',
      };

      const awsError = new Error('AWS Service Error');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockRejectedValue(awsError);

      // When & Then
      await expect(service.generatePresignedUrl(request)).rejects.toThrow();

      expect(loggerErrorSpy).toHaveBeenCalledWith('Presigned URL 생성 실패:', awsError);

      loggerErrorSpy.mockRestore();
    });
  });
});

