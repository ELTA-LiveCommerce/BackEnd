/**
 * 이 설정 파일은 ConfigModule.forRoot()의 load 옵션에서 사용되지만,
 * 실제로 대부분의 코드는 configService.get()을 직접 호출하여 환경 변수에 접근합니다.
 * 네스트 구조(예: configService.get('kakao.clientId'))를 사용하는 코드가 없기 때문에
 * 이 파일은 대부분 참조용으로만 사용됩니다.
 */
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'mydb',
    synchronize: process.env.NODE_ENV === 'development', // 개발 환경에서만 true
    logging: process.env.NODE_ENV === 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'defaultSecret',
    expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
  },
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID,
    callbackUrl: process.env.KAKAO_CALLBACK_URL,
  },
  kakaoAlimTalk: {
    apiKey: process.env.KAKAO_API_KEY,
    senderId: process.env.KAKAO_SENDER_ID,
    apiUrl: process.env.KAKAO_API_URL || 'https://alimtalk-api.kakao.com/v2/sender',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    callbackUrl: process.env.APPLE_CALLBACK_URL,
    clientSecretExpiresIn: '60d',
  },
  // 필요에 따라 다른 설정 추가 가능
  // 예: aws, redis 등
});

