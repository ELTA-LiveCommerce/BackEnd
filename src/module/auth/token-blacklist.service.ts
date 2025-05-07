import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';

import { TokenBlacklist } from './entity/token-blacklist.entity';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: EntityRepository<TokenBlacklist>,
    private readonly em: EntityManager,
  ) {}

  /**
   * 토큰이 블랙리스트에 있는지 확인
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({ token });
    return !!blacklistedToken;
  }

  /**
   * 토큰을 블랙리스트에 추가
   */
  async addToBlacklist(token: string, userId: string, expiresAt: Date): Promise<TokenBlacklist> {
    const blacklistedToken = new TokenBlacklist();
    blacklistedToken.token = token;
    blacklistedToken.userId = userId;
    blacklistedToken.expiresAt = expiresAt;

    await this.em.persistAndFlush(blacklistedToken);
    this.logger.log(`토큰이 블랙리스트에 추가됨: userId=${userId}`);
    return blacklistedToken;
  }

  /**
   * 만료된 블랙리스트 토큰 정리
   */
  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    const expiredTokens = await this.tokenBlacklistRepository.find({ expiresAt: { $lt: now } });

    if (expiredTokens.length > 0) {
      await this.em.removeAndFlush(expiredTokens);
      this.logger.log(`만료된 토큰 ${expiredTokens.length}개 정리 완료`);
    }

    return expiredTokens.length;
  }
}
