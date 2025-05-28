import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from './file.controller';
import { AwsS3Service } from '@/module/file/aws-s3.service';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { PresignedUrlRequestDto } from './dto/presigned-url.request.dto';
import { PresignedUrlResponseDto } from './dto/presigned-url.response.dto';

describe('FileController (V2)', () => {
  let controller: FileController;
  let awsS3Service: jest.Mocked<AwsS3Service>;

  beforeEach(async () => {
    const mockAwsS3Service = {
      generatePresignedUrl: jest.fn(),
      generateMultiplePresignedUrls: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: AwsS3Service,
          useValue: mockAwsS3Service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FileController>(FileController);
    awsS3Service = module.get(AwsS3Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generatePresignedUrl', () => {
    it('should generate a presigned URL', async () => {
      // Given
      const request: PresignedUrlRequestDto = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        category: 'products',
      };

      const mockResult = {
        uploadUrl: 'https://test-bucket.s3.amazonaws.com/presigned-url',
        key: 'products/uuid.jpg',
        fileUrl: 'https://test-bucket.s3.amazonaws.com/products/uuid.jpg',
        expiresIn: 900,
      };

      awsS3Service.generatePresignedUrl.mockResolvedValue(mockResult);

      // When
      const result = await controller.generatePresignedUrl(request);

      // Then
      expect(awsS3Service.generatePresignedUrl).toHaveBeenCalledWith({
        fileName: request.fileName,
        fileType: request.fileType,
        category: request.category,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Presigned URL 생성 성공');
      expect(result.data).toEqual(mockResult);
      expect(result.timestamp).toBeDefined();
    });

    it('should generate a presigned URL without category', async () => {
      // Given
      const request: PresignedUrlRequestDto = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
      };

      const mockResult = {
        uploadUrl: 'https://test-bucket.s3.amazonaws.com/presigned-url',
        key: 'general/uuid.jpg',
        fileUrl: 'https://test-bucket.s3.amazonaws.com/general/uuid.jpg',
        expiresIn: 900,
      };

      awsS3Service.generatePresignedUrl.mockResolvedValue(mockResult);

      // When
      const result = await controller.generatePresignedUrl(request);

      // Then
      expect(awsS3Service.generatePresignedUrl).toHaveBeenCalledWith({
        fileName: request.fileName,
        fileType: request.fileType,
        category: undefined,
      });

      expect(result.data.key).toBe('general/uuid.jpg');
    });
  });
});

