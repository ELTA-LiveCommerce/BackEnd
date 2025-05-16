import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().default('1h'),

  // Kakao OAuth
  KAKAO_CLIENT_ID: Joi.string().required(),
  KAKAO_CALLBACK_URL: Joi.string().uri().required(), // URI 형식 검사 추가

  // Apple OAuth
  APPLE_CLIENT_ID: Joi.string().required(),
  APPLE_TEAM_ID: Joi.string().required(),
  APPLE_KEY_ID: Joi.string().required(),
  APPLE_PRIVATE_KEY: Joi.string().required(),
  APPLE_CALLBACK_URL: Joi.string().uri().required(),

  // Kakao AlimTalk
  KAKAO_API_KEY: Joi.string().allow('').default(''),
  KAKAO_SENDER_ID: Joi.string().allow('').default(''),
  KAKAO_API_URL: Joi.string().uri().allow('').default('https://alimtalk-api.kakao.com/v2/sender'),

  // Sentry
  SENTRY_DSN: Joi.string().allow(''), // 비워둘 수 있도록 허용

  // AWS (필요시 주석 해제 및 구체화)
  // AWS_ACCESS_KEY_ID: Joi.string().required(),
  // AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  // AWS_REGION: Joi.string().required(),
  // AWS_S3_BUCKET_NAME: Joi.string().required(),
});

