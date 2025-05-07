import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 토큰 인증 가드
 * passport-jwt 전략을 사용하여 JWT 토큰을 검증합니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
