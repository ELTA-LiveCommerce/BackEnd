import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';

import { AuthService } from '../auth.service';
import { KakaoUserDto } from '../dto/kakao-auth.dto';

interface KakaoProfile extends Profile {
  _json: {
    id: number;
    properties: {
      nickname: string;
      profile_image?: string;
      thumbnail_image?: string;
    };
    kakao_account?: {
      email?: string;
    };
  };
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('KAKAO_CLIENT_ID') || '',
      callbackURL: configService.get<string>('KAKAO_CALLBACK_URL') || '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: KakaoProfile,
    done: (error: Error | null, user?: any) => void,
  ): Promise<void> {
    try {
      const { id, properties, kakao_account } = profile._json;

      const kakaoUser: KakaoUserDto = {
        kakaoId: id,
        email: kakao_account?.email,
        nickname: properties.nickname,
        profileImage: properties.profile_image,
        thumbnailImage: properties.thumbnail_image,
      };

      const user = await this.authService.validateKakaoUser(kakaoUser);
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }
}
