import { ApiProperty } from '@nestjs/swagger';

/**
 * V2 API의 기본 응답 형식
 */
export class BaseResponseV2<T> {
  @ApiProperty({ example: true, description: '성공 여부' })
  success: boolean;

  @ApiProperty({ example: 200, description: 'HTTP 상태 코드' })
  statusCode: number;

  @ApiProperty({ example: '요청 성공', description: '응답 메시지' })
  message: string;

  @ApiProperty({ description: '응답 데이터' })
  data: T;

  @ApiProperty({ example: '2024-05-12T14:30:00Z', description: '응답 타임스탬프' })
  timestamp: string;

  constructor(success: boolean, statusCode: number, message: string, data: T) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message = '요청 성공', statusCode = 200): BaseResponseV2<T> {
    return new BaseResponseV2(true, statusCode, message, data);
  }

  static error<T>(message = '요청 실패', statusCode = 500, data: T | null = null): BaseResponseV2<T | null> {
    return new BaseResponseV2(false, statusCode, message, data);
  }
}

/**
 * 페이지네이션된 목록 응답을 위한 인터페이스
 */
export interface PagedResponseData<T> {
  /**
   * 항목 목록
   */
  items: T[];

  /**
   * 전체 항목 수
   */
  total: number;

  /**
   * 현재 페이지 번호
   */
  page: number;

  /**
   * 페이지당 항목 수
   */
  limit: number;

  /**
   * 전체 페이지 수
   */
  totalPages: number;
}

/**
 * 페이지네이션된 응답을 위한 클래스
 */
export class PagedResponseV2<T> extends BaseResponseV2<PagedResponseData<T>> {
  constructor(items: T[], total: number, page: number, limit: number, message = '요청 성공', statusCode = 200) {
    const totalPages = Math.ceil(total / limit);
    const data: PagedResponseData<T> = { items, total, page, limit, totalPages };
    super(true, statusCode, message, data);
  }

  /**
   * 페이지네이션 응답 생성
   */
  static create<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message = '요청 성공',
    statusCode = 200,
  ): PagedResponseV2<T> {
    return new PagedResponseV2(items, total, page, limit, message, statusCode);
  }
}

/**
 * 빈 응답을 위한 클래스
 */
export class EmptyResponseV2 extends BaseResponseV2<null> {
  constructor(message = 'OK', statusCode = 200, success = true) {
    super(success, statusCode, message, null);
  }
}

export class ErrorResponseV2 extends BaseResponseV2<null> {
  constructor(message: string, statusCode: number) {
    super(false, statusCode, message, null);
  }
}
