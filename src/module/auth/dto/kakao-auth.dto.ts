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

export interface KakaoUserDto {
  kakaoId: number;
  email?: string;
  nickname: string;
  profileImage?: string;
  thumbnailImage?: string;
}

// 카카오 API 응답 타입 추가
export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    name_needs_agreement?: boolean;
    name?: string;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    age_range_needs_agreement?: boolean;
    age_range?: string;
    birthyear_needs_agreement?: boolean;
    birthyear?: string;
    birthday_needs_agreement?: boolean;
    birthday?: string;
    birthday_type?: string;
    gender_needs_agreement?: boolean;
    gender?: string;
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
    ci_needs_agreement?: boolean;
    ci?: string;
    ci_authenticated_at?: string;
  };
  for_partner?: {
    uuid: string;
  };
}
