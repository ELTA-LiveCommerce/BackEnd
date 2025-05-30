import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { isAxiosError } from 'axios';
import { Request, Response } from 'express';

import { BaseResponse } from '../common';

@Catch(HttpException, URIError, Error)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ERROR');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(e: HttpException | Error, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const responseForExpress = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = 'getStatus' in e ? e.getStatus() : 500;
    const customStatusCode = this.getCustomStatusCode(status);
    const errorResponse = 'getResponse' in e ? e.getResponse() : e.name;

    let resBody: Record<string, any> | undefined = undefined;
    if (errorResponse instanceof BaseResponse) {
      resBody = errorResponse;
    } else {
      const errorMessage = typeof errorResponse === 'string'
        ? errorResponse
        : errorResponse && typeof errorResponse === 'object' && 'message' in errorResponse
          ? (errorResponse as any).message
          : String(errorResponse);

      resBody = {
        success: false,
        error: {
          message: errorMessage,
          code: customStatusCode,
        },
      };

      // 토큰 만료 오류에 대한 특별 처리
      if (status === HttpStatus.UNAUTHORIZED && 
          typeof errorMessage === 'string' &&
          (errorMessage.includes('토큰이 만료되었습니다') || 
           errorMessage.includes('token expired'))) {
        resBody.error.type = 'TOKEN_EXPIRED';
        resBody.error.hint = '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받으세요. POST /v2/auth/refresh';
      }
    }

    const errorDetails = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      errorName: e.name,
      message: e.message,
      stack: e.stack,
      status,
      body: request.body,
      params: request.params,
      query: request.query,
      ...(isAxiosError(e) && {
        axiosError: {
          path: e.request?.path,
          method: e.request?.method,
          data: e.request?.data,
          response: e.response?.data,
        },
      }),
    };

    if (process.env.NODE_ENV === 'development') {
      (resBody as Record<string, any>).detail = errorDetails;
    }

    this.logger.error(`Exception occurred: ${e.message}`, e.stack);
    this.logger.error(`Request details: ${JSON.stringify(errorDetails, null, 2)}`);

    switch (e.name) {
      case 'URIError':
        responseForExpress.status(400).json({
          message: 'Malformed URI',
          messageKey: 'error.malformedUri',
        });
        break;
      default:
        responseForExpress.status(status).json(resBody);
        break;
    }
  }

  private getCustomStatusCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST as number:
        return 'C_400';
      case HttpStatus.UNAUTHORIZED as number:
        return 'C_401';
      case HttpStatus.FORBIDDEN as number:
        return 'C_403';
      default:
        return status.toString();
    }
  }
}
