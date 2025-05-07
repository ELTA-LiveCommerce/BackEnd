import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .addCookieAuth('sid')
    .setTitle('API Document')
    .setDescription('REST API document')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api')
    .addServer('/')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationSorter: 'alpha',
    },
  });
}
