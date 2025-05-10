// import { Options, LogLevel } from '@mikro-orm/core'; // Options 임포트 제거
// Options 임포트 추가
import { JSMigrationGenerator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql'; // PostgreSqlDriver 임포트
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
// import { Logger as NestJsLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Login } from '@/module/auth/entity/login.entity';
import { TokenBlacklist } from '@/module/auth/entity/token-blacklist.entity';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Delivery } from '@/module/delivery/entity/delivery.entity';
import { OrderItem } from '@/module/order/entity/order-item.entity';
import { Order } from '@/module/order/entity/order.entity';
import { ReturnRequest } from '@/module/order/entity/return-request.entity';
import { Payment } from '@/module/payment/entity/payment.entity';
import { Refund } from '@/module/payment/entity/refund.entity';
import { BroadcastProduct } from '@/module/product/entity/broadcast-product.entity';
import { Product } from '@/module/product/entity/product.entity';
import { Follow } from '@/module/user/entity/follow.entity';
import { ShippingAddress } from '@/module/user/entity/shipping-address.entity';
import { User } from '@/module/user/entity/user.entity';

// MikroOrmOptions 타입 정의 제거 또는 주석 처리 (MikroOrmModuleOptions 사용)

// CustomMikroOrmLogger 클래스 임시 주석
// class CustomMikroOrmLogger extends MikroOrmLogger { ... }

// 반환 타입을 다시 any로 변경
const createMikroOrmConfig = (configService?: ConfigService): any => {
  const environment = process.env.NODE_ENV || 'development';

  const allEntities = [
    Login,
    TokenBlacklist,
    Broadcast,
    Delivery,
    OrderItem,
    Order,
    ReturnRequest,
    Payment,
    Refund,
    BroadcastProduct,
    Product,
    Follow,
    ShippingAddress,
    User,
  ];

  // config 객체의 타입도 다시 any로 변경
  const config: any = {
    driver: PostgreSqlDriver,
    entities: allEntities,
    strict: true,
    allowGlobalContext: process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT === 'true',
    tsNode: true,
    debug: true,
    highlighter: new SqlHighlighter(),
    migrations: {
      path: './dist/migrations',
      generator: JSMigrationGenerator,
      glob: '!(*.d).{js,ts}',
    },
    // extensions: [SeedManager], // 주석 처리 또는 seeder 객체로 변경
    seeder: {
      // seeder 속성 추가 (MikroORM v5 방식)
      path: './src/infra/database/seeders', // 시더 파일 경로
      pathTs: './src/infra/database/seeders', // TypeScript 시더 파일 경로 (tsNode: true 일 때)
      defaultSeeder: 'DatabaseSeeder', // 기본 시더 (필요시)
      glob: '!(*.d).{js,ts}', // 시더 파일 확장자
      emit: 'ts', // TypeScript로 작업 시
      fileName: (className: string) => className, // 파일명 생성 방식
    },
  };

  if (environment === 'test') {
    Object.assign(config, {
      dbName: configService?.get<string>('POSTGRES_DB') || process.env.POSTGRES_DB || 'elta_test',
      user: configService?.get<string>('POSTGRES_USER') || process.env.POSTGRES_USER || 'elta',
      password: configService?.get<string>('POSTGRES_PASSWORD') || process.env.POSTGRES_PASSWORD || 'elta1234',
      host: configService?.get<string>('POSTGRES_HOST') || process.env.POSTGRES_HOST || 'postgres-test',
      port: configService?.get<number>('POSTGRES_PORT') || Number(process.env.POSTGRES_PORT) || 5432,
      allowGlobalContext: true,
      forceUtcTimezone: true,
      debug: false,
    });
  } else if (environment === 'development') {
    Object.assign(config, {
      dbName: configService?.get<string>('POSTGRES_DB') || process.env.POSTGRES_DB || 'elta_dev',
      user: configService?.get<string>('POSTGRES_USER') || process.env.POSTGRES_USER || 'elta',
      password: configService?.get<string>('POSTGRES_PASSWORD') || process.env.POSTGRES_PASSWORD || 'elta1234',
      host: configService?.get<string>('POSTGRES_HOST') || process.env.POSTGRES_HOST || 'postgres-dev',
      port: configService?.get<number>('POSTGRES_PORT') || Number(process.env.POSTGRES_PORT) || 5432,
      forceUtcTimezone: true,
    });
  } else if (environment === 'production') {
    Object.assign(config, {
      dbName: configService?.get<string>('POSTGRES_DB') || process.env.POSTGRES_DB,
      user: configService?.get<string>('POSTGRES_USER') || process.env.POSTGRES_USER,
      password: configService?.get<string>('POSTGRES_PASSWORD') || process.env.POSTGRES_PASSWORD,
      host: configService?.get<string>('POSTGRES_HOST') || process.env.POSTGRES_HOST || 'postgres',
      port: configService?.get<number>('POSTGRES_PORT') || Number(process.env.POSTGRES_PORT) || 5432,
      forceUtcTimezone: true,
      debug: false,
    });
  }

  return config;
};

export default createMikroOrmConfig;

// CLI에서 사용하기 위한 export (defineConfig 적용)
// import { defineConfig as cliDefineConfig } from '@mikro-orm/postgresql';
// export const mikroOrmCliConfig = cliDefineConfig(createMikroOrmConfig());
