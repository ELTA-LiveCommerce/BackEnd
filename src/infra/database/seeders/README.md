# Database Seeders

이 디렉토리는 데이터베이스 시더 파일들을 포함합니다.

## 사용 가능한 시더

### AdminSeeder
관리자 계정을 생성하는 시더입니다.

**환경 변수 설정:**
```bash
ADMIN_LOGIN_ID=admin@elta.com        # Admin 로그인 ID
ADMIN_PASSWORD=EltaAdmin123!@#       # Admin 비밀번호
ADMIN_NAME=ELTA 관리자               # Admin 이름
```

**실행 방법:**
```bash
# Admin 계정만 생성
pnpm run seed:admin

# 또는 직접 MikroORM CLI 사용
npx mikro-orm seeder:run --class=AdminSeeder
```

### SellerSeeder
기본 판매자 계정을 생성하는 시더입니다.

**환경 변수 설정:**
```bash
SELLER_LOGIN_ID=seller@elta.com      # Seller 로그인 ID
SELLER_PASSWORD=EltaSeller123!@#     # Seller 비밀번호
SELLER_NAME=ELTA 기본 판매자         # Seller 이름
SELLER_PHONE_NUMBER=010-1234-5678    # Seller 전화번호
SELLER_BANK_NAME=국민은행            # Seller 은행명
SELLER_BANK_ACCOUNT=123-456-789012   # Seller 계좌번호
SELLER_ACCOUNT_NUMBER=123456789012   # Seller 계정번호
```

**실행 방법:**
```bash
# Seller 계정만 생성
pnpm run seed:seller

# 또는 직접 MikroORM CLI 사용
npx mikro-orm seeder:run --class=SellerSeeder
```

**특징 (공통):**
- 중복 생성 방지: 이미 동일한 로그인 ID로 계정이 존재하면 생성하지 않음
- 환경변수 기반: `.env` 파일을 통해 계정 정보 설정 가능
- 보안 강화: 프로덕션 환경에서는 salt rounds를 12로 설정
- 프로덕션 안전: 프로덕션 환경에서는 비밀번호를 로그에 출력하지 않음

### Test000UserSeeder
테스트용 사용자 계정들을 생성하는 시더입니다.
- Admin, Seller, Viewer 역할의 테스트 계정들을 생성
- 개발 및 테스트 환경에서만 사용 권장

## 기본 계정 생성

```bash
# Admin + Seller 계정 한 번에 생성 (권장)
pnpm run seed:basic

# Admin 계정만 생성
pnpm run seed:admin

# Seller 계정만 생성
pnpm run seed:seller
```

## 모든 시더 실행

```bash
# 모든 시더 실행 (테스트 계정 포함)
pnpm run seed
```

## 주의사항

1. **프로덕션 환경**: AdminSeeder는 프로덕션 환경에서 안전하게 사용할 수 있도록 설계되었습니다.
2. **환경변수**: 민감한 정보(비밀번호 등)는 반드시 환경변수로 설정하세요.
3. **중복 방지**: AdminSeeder는 중복 계정 생성을 방지합니다.
4. **테스트 시더**: Test000UserSeeder는 개발/테스트 환경에서만 사용하세요.

## 환경변수 설정 예시

`.env` 파일에 다음과 같이 설정하세요:

```bash
# Admin 계정 설정
ADMIN_LOGIN_ID=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=시스템 관리자

# Seller 계정 설정
SELLER_LOGIN_ID=seller@yourdomain.com
SELLER_PASSWORD=YourSellerPassword123!
SELLER_NAME=기본 판매자
SELLER_PHONE_NUMBER=010-9999-8888
SELLER_BANK_NAME=신한은행
SELLER_BANK_ACCOUNT=999-888-777666
SELLER_ACCOUNT_NUMBER=999888777666
```

## 트러블슈팅

### MikroORM config file not found 오류

만약 `Error: MikroORM config file not found in ['./mikro-orm.config.js']` 오류가 발생한다면:

1. 프로젝트 루트에 `mikro-orm.config.js` 파일이 있는지 확인
2. 프로젝트가 빌드되었는지 확인: `pnpm run build`
3. 환경변수가 올바르게 설정되었는지 확인 (`.env` 파일)

### 데이터베이스 연결 오류

데이터베이스 연결 오류가 발생한다면:

1. 데이터베이스 서버가 실행 중인지 확인
2. `.env` 파일의 데이터베이스 설정 확인
3. Docker를 사용하는 경우: `docker-compose up -d`

## 시더 개발 가이드

새로운 시더를 작성할 때는 다음 규칙을 따르세요:

1. **클래스명**: `[목적]Seeder` 형식으로 명명
2. **파일명**: `[목적].seeder.ts` 형식으로 명명
3. **중복 방지**: 데이터 중복 생성을 방지하는 로직 포함
4. **환경변수**: 설정 가능한 값들은 환경변수로 처리
5. **로깅**: 실행 결과를 명확히 로깅
6. **오류 처리**: 적절한 오류 처리 로직 포함

## 프로젝트 설정

이 프로젝트에는 다음 파일들이 시더 실행을 위해 설정되어 있습니다:

- `mikro-orm.config.js`: MikroORM CLI용 설정 파일
- `package.json`: 시더 실행 스크립트
- `.env.template`: 환경변수 템플릿 