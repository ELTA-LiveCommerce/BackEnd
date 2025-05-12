import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';

import { AppModule } from './app.module';
import { initDatabase } from './database';
import { HttpExceptionFilter } from './shared/filter/http-exception.filter';
import { setupSwagger } from './infra/swagger/swagger.config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  await initDatabase();
  // const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
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

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  setupSwagger(app);

  // Global Filters
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));

  app.useBodyParser('json', { limit: '2gb' });

  if (NODE_ENV === 'development') {
    await setupSwagger(app);
  }

  await app.listen(servicePort);

  logger.log(`Server is running on localhost:${servicePort} with ${NODE_ENV}`);
}

bootstrap();
