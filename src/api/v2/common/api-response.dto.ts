import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

/**
 * V2 API의 표준 응답 형식
 */
export class ApiResponse<T> {
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

  /**
   * 성공 응답 생성
   */
  static success<T>(data: T, message = '요청 성공', statusCode = 200): ApiResponse<T> {
    return new ApiResponse(true, statusCode, message, data);
  }

  /**
   * 에러 응답 생성
   */
  static error<T>(message = '요청 실패', statusCode = 500, data: T | null = null): ApiResponse<T | null> {
    return new ApiResponse(false, statusCode, message, data);
  }

  /**
   * Swagger 문서화를 위한 데이터 타입 지정
   */
  static withData<T>(type: Type<T>): Type<ApiResponse<T>> {
    class ApiResponseWithData extends ApiResponse<T> {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ApiResponseWithData.prototype.constructor = ApiResponse as any;

    // Swagger 속성 설정
    ApiProperty({
      type: type,
      description: '응답 데이터',
    })(ApiResponseWithData.prototype, 'data');

    return ApiResponseWithData;
  }
}
