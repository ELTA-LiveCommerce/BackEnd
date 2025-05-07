import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';

import { User } from '@/module/user/entity/user.entity';

import { Login, LoginProvider } from './entity/login.entity';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    @InjectRepository(Login)
    private readonly loginRepository: EntityRepository<Login>,
    private readonly em: EntityManager,
  ) {}

  async findByProviderId(provider: LoginProvider, providerId: string): Promise<Login | null> {
    return await this.loginRepository.findOne({ provider, providerId });
  }

  async createLoginInfo(
    user: User,
    provider: LoginProvider,
    providerId: string,
    data: {
      email?: string;
      nickname?: string;
      profileImage?: string;
      accessToken?: string;
      refreshToken?: string;
    },
  ): Promise<Login> {
    const login = new Login();
    login.user = user;
    login.provider = provider;
    login.providerId = providerId;
    login.email = data.email;
    login.nickname = data.nickname;
    login.profileImage = data.profileImage;
    login.accessToken = data.accessToken;
    login.refreshToken = data.refreshToken;
    login.lastLoginAt = new Date();

    await this.em.persistAndFlush(login);
    this.logger.log(`새 로그인 정보 등록: ${provider} for user ${user.id}`);
    return login;
  }

  async updateLoginInfo(
    login: Login,
    data: {
      accessToken?: string;
      refreshToken?: string;
      nickname?: string;
      profileImage?: string;
    },
  ): Promise<Login> {
    if (data.accessToken) login.accessToken = data.accessToken;
    if (data.refreshToken) login.refreshToken = data.refreshToken;
    if (data.nickname) login.nickname = data.nickname;
    if (data.profileImage) login.profileImage = data.profileImage;
    login.lastLoginAt = new Date();

    await this.em.persistAndFlush(login);
    this.logger.log(`로그인 정보 업데이트: ${login.provider} for user ${login.user.id}`);
    return login;
  }
}
