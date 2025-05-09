import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
  path: string;
  url: string;
}

/**
 * 파일 업로드 및 관리를 위한 서비스
 */
@Injectable()
export class FileService {
  /**
   * 파일 업로드 후 결과 정보 반환
   */
  async uploadFile(file: Express.Multer.File, category: string): Promise<UploadResult> {
    if (!file) {
      throw new Error('파일이 존재하지 않습니다.');
    }

    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const fileUrl = `${serverUrl}/uploads/${category}/${file.filename}`;

    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: fileUrl,
    };
  }

  /**
   * 여러 파일 업로드 후 결과 정보 반환
   */
  async uploadMultipleFiles(files: Express.Multer.File[], category: string): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new Error('파일이 존재하지 않습니다.');
    }

    return Promise.all(files.map((file) => this.uploadFile(file, category)));
  }

  /**
   * 파일명 생성
   */
  generateFilename(originalname: string): string {
    const filename = path.parse(originalname).name.replace(/\s/g, '') + '-' + uuidv4();
    const extension = path.parse(originalname).ext;
    return `${filename}${extension}`;
  }
}
