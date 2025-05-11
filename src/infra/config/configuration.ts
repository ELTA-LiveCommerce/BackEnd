export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.NODE_ENV === 'development', // 개발 환경에서만 true
    logging: process.env.NODE_ENV === 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION_TIME || '1h',
  },
  kakao: {
    clientId: process.env.KAKAO_CLIENT_ID,
    callbackUrl: process.env.KAKAO_CALLBACK_URL,
  },
  // 필요에 따라 다른 설정 추가 가능
  // 예: aws, redis 등
});
