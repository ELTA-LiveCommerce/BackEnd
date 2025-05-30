import { Injectable, ExecutionContext, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * JWT 토큰 인증 가드
 * passport-jwt 전략을 사용하여 JWT 토큰을 검증합니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // 에러가 있는 경우 그대로 throw
    if (err) {
      throw err;
    }

    // 사용자 정보가 없는 경우
    if (!user) {
      // info 객체에서 더 자세한 에러 정보 확인
      let message = '인증 정보가 유효하지 않습니다.';
      
      if (info) {
        if (info.name === 'TokenExpiredError') {
          message = '토큰이 만료되었습니다. 다시 로그인해주세요.';
          // 토큰 만료에 대한 더 자세한 정보를 포함한 에러 생성
          const errorResponse = {
            statusCode: HttpStatus.UNAUTHORIZED,
            message: message,
            error: 'Unauthorized',
            type: 'TOKEN_EXPIRED',
            hint: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받으세요. POST /v2/auth/refresh'
          };
          throw new HttpException(errorResponse, HttpStatus.UNAUTHORIZED);
        } else if (info.name === 'JsonWebTokenError') {
          message = '유효하지 않은 토큰입니다.';
        } else if (info.name === 'NotBeforeError') {
          message = '토큰이 아직 활성화되지 않았습니다.';
        } else if (info.message) {
          // 기타 에러 메시지가 있는 경우
          if (info.message === 'No auth token') {
            message = '인증 토큰이 제공되지 않았습니다.';
          } else {
            message = info.message;
          }
        }
      }
      
      throw new UnauthorizedException(message);
    }
    
    return user;
  }
}
