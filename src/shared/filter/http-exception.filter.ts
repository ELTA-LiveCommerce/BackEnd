import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { Request, Response } from 'express';

import { BaseResponse } from '../common';

@Catch(HttpException, URIError, Error)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ERROR');

  catch(e: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const errorData = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = 'getStatus' in e ? e.getStatus() : 500;
    const customStatusCode = this.getCustomStatusCode(status);
    const errorResponse = 'getResponse' in e ? e.getResponse() : e.name;

    let res: Record<string, any> | undefined = undefined;
    if (errorResponse instanceof BaseResponse) {
      res = errorResponse;
    } else {
      res = {
        success: false,
        error: {
          message:
            typeof errorResponse === 'string'
              ? errorResponse
              : 'message' in errorResponse
                ? errorResponse.message
                : errorResponse,
          code: customStatusCode,
        },
      };
    }

    // 스택 트레이스와 상세 정보 로깅
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
      res.detail = errorDetails;
    }

    this.logger.error(`Exception occurred: ${e.message}`, e.stack);
    this.logger.error(`Request details: ${JSON.stringify(errorDetails, null, 2)}`);

    switch (e.name) {
      case 'URIError':
        errorData.status(400).json({
          message: 'Malformed URI',
          messageKey: 'error.malformedUri',
        });
        break;
      default:
        errorData.status(status).json(res);
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
