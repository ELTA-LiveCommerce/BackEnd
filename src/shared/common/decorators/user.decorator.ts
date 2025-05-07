import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Request에서 사용자 정보를 추출하는 데코레이터
 * @example
 * ```
 * @Get()
 * getProfile(@UserDecorator() user) {
 *   return user;
 * }
 * ```
 */
export const UserDecorator = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
