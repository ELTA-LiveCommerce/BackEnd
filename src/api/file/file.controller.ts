import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { imageFileFilter, FILE_SIZE_LIMITS, fileStorage } from '@/infra/config/file-upload.config';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { FileService } from '@/module/file/file.service';

/**
 * 파일 업로드 컨트롤러
 */
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 이미지 단일 업로드 API
   * @param file 업로드 파일
   * @param category 카테고리 (products, profiles, broadcasts 등)
   * @returns 파일 업로드 정보
   */
  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage.general,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: FILE_SIZE_LIMITS.IMAGE,
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('category') category: string = 'general') {
    if (!file) {
      throw new BadRequestException('이미지 파일이 없습니다.');
    }

    const allowedCategories = ['products', 'profiles', 'broadcasts', 'general'];
    if (!allowedCategories.includes(category)) {
      category = 'general';
    }

    const result = await this.fileService.uploadFile(file, category);
    return {
      success: true,
      imageUrl: result.url,
      filename: result.filename,
      originalname: result.originalname,
    };
  }

  /**
   * 이미지 다중 업로드 API
   * @param files 업로드 파일들
   * @param category 카테고리 (products, profiles, broadcasts 등)
   * @returns 파일 업로드 정보 리스트
   */
  @Post('upload/images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: fileStorage.general,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: FILE_SIZE_LIMITS.IMAGE,
      },
    }),
  )
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('category') category: string = 'general',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('이미지 파일이 없습니다.');
    }

    const allowedCategories = ['products', 'profiles', 'broadcasts', 'general'];
    if (!allowedCategories.includes(category)) {
      category = 'general';
    }

    const results = await this.fileService.uploadMultipleFiles(files, category);
    return {
      success: true,
      images: results.map((result) => ({
        imageUrl: result.url,
        filename: result.filename,
        originalname: result.originalname,
      })),
    };
  }
}
