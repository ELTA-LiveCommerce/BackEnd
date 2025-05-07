import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Multer 이미지 업로드 설정
 */
export const storageConfig = {
  /**
   * 프로필 이미지 저장 설정
   */
  profileImage: diskStorage({
    destination: './uploads/profiles',
    filename: (req, file, callback) => {
      const randomName = uuidv4();
      const extension = extname(file.originalname);
      callback(null, `${randomName}${extension}`);
    },
  }),
};

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

/**
 * 이미지 파일만 필터링하는 함수
 */
export const imageFileFilter = (
  req: any,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
  callback(null, true);
};
