import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * 파일 저장 위치 상수
 */
export const UPLOAD_PATHS = {
  PROFILES: './uploads/profiles',
  PRODUCTS: './uploads/products',
  BROADCASTS: './uploads/broadcasts',
  GENERAL: './uploads/general',
};

/**
 * 파일 저장 설정
 */
export const fileStorage = {
  /**
   * 일반 파일 저장 설정
   */
  general: diskStorage({
    destination: UPLOAD_PATHS.GENERAL,
    filename: (req, file, callback) => {
      const randomName = uuidv4();
      const extension = extname(file.originalname);
      callback(null, `${randomName}${extension}`);
    },
  }),

  /**
   * 상품 이미지 저장 설정
   */
  product: diskStorage({
    destination: UPLOAD_PATHS.PRODUCTS,
    filename: (req, file, callback) => {
      const randomName = uuidv4();
      const extension = extname(file.originalname);
      callback(null, `${randomName}${extension}`);
    },
  }),

  /**
   * 프로필 이미지 저장 설정
   */
  profile: diskStorage({
    destination: UPLOAD_PATHS.PROFILES,
    filename: (req, file, callback) => {
      const randomName = uuidv4();
      const extension = extname(file.originalname);
      callback(null, `${randomName}${extension}`);
    },
  }),

  /**
   * 방송 이미지 저장 설정
   */
  broadcast: diskStorage({
    destination: UPLOAD_PATHS.BROADCASTS,
    filename: (req, file, callback) => {
      const randomName = uuidv4();
      const extension = extname(file.originalname);
      callback(null, `${randomName}${extension}`);
    },
  }),
};

/**
 * 이미지 파일 필터링
 */
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new BadRequestException('이미지 파일만 업로드할 수 있습니다.'), false);
  }
  callback(null, true);
};

/**
 * 파일 크기 제한 (바이트 단위)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
};
