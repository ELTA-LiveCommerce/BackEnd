import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT로 인증된 사용자 정보를 요청 객체에서 추출하는 데코레이터
 * JwtAuthGuard와 함께 사용해야 합니다.
 */
export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
