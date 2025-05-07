export class KakaoProfileDto {
  id: number;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    email?: string;
    profile?: {
      nickname: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
  };
}

export class KakaoUserDto {
  kakaoId: number;
  email?: string;
  nickname: string;
  profileImage?: string;
  thumbnailImage?: string;
}
