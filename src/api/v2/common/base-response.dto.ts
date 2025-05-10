/**
 * V2 API의 기본 응답 형식
 */
export class BaseResponseV2<T> {
  /**
   * 응답 상태 코드
   */
  statusCode: number;

  /**
   * 응답 메시지
   */
  message: string;

  /**
   * 요청 성공 여부
   */
  success: boolean;

  /**
   * 응답 데이터
   */
  data: T;

  /**
   * 응답 생성 시간
   */
  timestamp: string;

  constructor(data: T, statusCode = 200, message = 'OK', success = true) {
    this.statusCode = statusCode;
    this.message = message;
    this.success = success;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 성공 응답 생성
   */
  static success(data: any, message = 'OK', statusCode = 200): BaseResponseV2<any> {
    return new BaseResponseV2<any>(data, statusCode, message, true);
  }

  /**
   * 실패 응답 생성
   */
  static error(message: string, statusCode = 400, data?: any): BaseResponseV2<any> {
    return new BaseResponseV2<any>(data || null, statusCode, message, false);
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
  /**
   * 페이지네이션 응답 생성
   */
  static from<T>(items: T[], total: number, page: number, limit: number, message = 'OK'): PagedResponseV2<T> {
    const totalPages = Math.ceil(total / limit);
    const data: PagedResponseData<T> = {
      items,
      total,
      page,
      limit,
      totalPages,
    };

    return new PagedResponseV2<T>(data, 200, message, true);
  }
}

/**
 * 빈 응답을 위한 클래스
 */
export class EmptyResponseV2 extends BaseResponseV2<null> {
  constructor(message = 'OK', statusCode = 200, success = true) {
    super(null, statusCode, message, success);
  }
}
