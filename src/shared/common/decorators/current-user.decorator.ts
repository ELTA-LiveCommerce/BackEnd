import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 요청 객체에서 현재 인증된 사용자 정보를 추출하는 커스텀 데코레이터입니다.
 * JwtAuthGuard와 함께 사용되어야 합니다.
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
