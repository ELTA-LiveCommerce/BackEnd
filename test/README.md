# ELTA 백엔드 테스트 가이드

## E2E 테스트 실행

E2E 테스트는 다음과 같이 실행할 수 있습니다:

```bash
# 모든 E2E 테스트 실행
pnpm test:e2e

# 특정 E2E 테스트만 실행
pnpm test:e2e:specific "Health Controller"
```

## 테스트 전략

ELTA 백엔드 프로젝트의 테스트는 다음과 같은 전략을 따릅니다:

### 1. 단순한 컨트롤러 테스트

인증이 필요없고 단순한 응답만 반환하는 컨트롤러는 E2E 테스트로 작성합니다:

- `Health` 컨트롤러
- `BaseResponse` 관련 테스트

이러한 테스트는 다음과 같이 작성합니다:

```typescript
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { HealthController } from '@/api/v2/health/health.controller';
import { HealthService } from '@/module/health/health.service';

describe('Health Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/v2/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/v2/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 2. 복잡한 인증 기반 API 테스트

인증이 필요하고 데이터베이스 상호작용이 많은 API는 다음 방법으로 테스트합니다:

1. 컨트롤러 단위 테스트 작성 - 서비스를 모킹하여 단위 테스트 수행
2. 서비스 단위 테스트 작성 - 서비스 로직 테스트
3. 통합 테스트 - 필요한 경우 서비스와 리포지토리를 포함한 통합 테스트 작성

예시:

```typescript
// 컨트롤러 단위 테스트
describe('ProfileController', () => {
  let controller: ProfileController;
  let userService: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            // ...더 많은 모킹 메서드들
          },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    userService = module.get<UserService>(UserService);
  });

  it('사용자 프로필 조회', async () => {
    const mockUser = { id: '123', name: '테스트 유저' };
    jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);
    
    const req = { user: { id: '123' } };
    const result = await controller.getProfile(req);
    
    expect(result).toEqual({ success: true, data: mockUser });
    expect(userService.findById).toHaveBeenCalledWith('123');
  });
});
```

## 향후 개선 방향

현재 E2E 테스트는 일부 제한된 API에 대해서만 수행됩니다. 향후 개선 방향은 다음과 같습니다:

1. `PassportJS` 및 `JwtStrategy`를 적절히 모킹하여 인증이 필요한 API에 대한 E2E 테스트 개선
2. 특정 시나리오 기반 테스트 케이스 추가
3. 테스트 데이터베이스 환경 개선

## 테스트 실행 시 주의사항

1. `.env.test` 파일이 올바르게 구성되어 있는지 확인하세요
2. 테스트 데이터베이스가 구성되어 있는지 확인하세요
3. 테스트 실행 전 `pnpm test:e2e:setup` 명령을 실행하여 테스트 환경을 설정하세요 