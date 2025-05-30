import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';

import { AppModule } from './app.module';
import { initDatabase } from './database';
import { HttpExceptionFilter } from './shared/filter/http-exception.filter';
import { swagger } from './swagger';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  await initDatabase();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  app.set('trust proxy', 1);

  const servicePort = configService.get<number>('PORT', 3000);
  const NODE_ENV = configService.get<string>('NODE_ENV', 'development');

  app.use(cookieParser());

  // 정적 파일 제공 설정
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS 설정 수정: undefined 제거
  const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean) as string[];
  app.enableCors({
    // origin: ['http://localhost:3000', process.env.FRONTEND_URL],
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          const constraints = error.constraints || {};
          return {
            field: error.property,
            errors: Object.values(constraints),
          };
        });
        
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: messages,
        });
      },
    }),
  );

  // Global Filters
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));

  app.useBodyParser('json', { limit: '2gb' });

  if (NODE_ENV === 'development') {
    swagger(app);
  }

  await app.listen(servicePort);

  logger.log(`Server is running on localhost:${servicePort} with ${NODE_ENV}`);
}

bootstrap();
