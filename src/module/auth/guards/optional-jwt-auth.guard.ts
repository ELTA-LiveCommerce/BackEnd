import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // 에러가 있거나 사용자가 없어도 요청을 계속 진행
    // user가 있으면 req.user에 설정됨
    return user || null;
  }
}