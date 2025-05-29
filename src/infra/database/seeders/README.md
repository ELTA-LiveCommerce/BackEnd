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

### ProductSeeder
테스트용 상품들을 생성하는 시더입니다.

**의존성:**
- SellerSeeder가 먼저 실행되어 있어야 합니다 (판매자 계정 필요)

**생성되는 상품들:**
1. **카카오톡 알림 테스트 상품 1** (15,000원, 재고 100개)
   - 무통장입금 알림톡 테스트용 기본 상품
2. **카카오톡 알림 테스트 상품 2** (25,000원, 재고 50개)
   - 다른 가격대의 알림톡 테스트용 상품
3. **고가 상품 알림 테스트** (100,000원, 재고 10개)
   - 고액 주문 시 알림톡 테스트용
4. **재고 부족 테스트 상품** (5,000원, 재고 2개)
   - 재고 부족 시나리오 테스트용
5. **할인가 적용 테스트 상품** (30,000원 → 20,000원, 재고 30개)
   - 할인가가 적용된 상품으로 최종 결제금액 테스트용

**실행 방법:**
```bash
# 상품만 생성 (판매자 계정이 있어야 함)
pnpm run seed:product

# 또는 직접 MikroORM CLI 사용
npx mikro-orm seeder:run --class=ProductSeeder
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

## 기본 설정

```bash
# Admin + Seller 계정 한 번에 생성 (권장)
pnpm run seed:basic

# Admin 계정만 생성
pnpm run seed:admin

# Seller 계정만 생성
pnpm run seed:seller

# 상품만 생성 (판매자 계정이 있어야 함)
pnpm run seed:product
```

## 전체 설정 (권장)

```bash
# Admin + Seller + Product 모두 생성 (카카오톡 알림 테스트에 최적)
pnpm run seed:full
```

## 모든 시더 실행

```bash
# 모든 시더 실행 (테스트 계정 포함)
pnpm run seed
```

## 카카오톡 알림 테스트를 위한 권장 순서

1. **기본 설정:**
   ```bash
   pnpm run seed:full
   ```

2. **테스트 실행:**
   ```bash
   node test-kakaotalk-notification-detailed.js
   # 또는
   ./quick-test.sh
   ```

3. **테스트 완료 후 확인:**
   - 010-3342-2799 번호로 카카오톡 알림 수신 확인
   - 서버 로그에서 알림 발송 로그 확인

## 주의사항

1. **프로덕션 환경**: AdminSeeder와 SellerSeeder는 프로덕션 환경에서 안전하게 사용할 수 있도록 설계되었습니다.
2. **환경변수**: 민감한 정보(비밀번호 등)는 반드시 환경변수로 설정하세요.
3. **중복 방지**: 모든 시더는 중복 생성을 방지합니다.
4. **테스트 시더**: Test000UserSeeder와 ProductSeeder는 개발/테스트 환경에서만 사용하세요.
5. **의존성**: ProductSeeder는 SellerSeeder가 먼저 실행되어야 합니다.

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

### ProductSeeder 실행 시 "판매자 계정이 없습니다" 오류

```bash
# SellerSeeder를 먼저 실행하세요
pnpm run seed:seller
# 그 다음 ProductSeeder 실행
pnpm run seed:product
```

## 시더 개발 가이드

새로운 시더를 작성할 때는 다음 규칙을 따르세요:

1. **클래스명**: `[목적]Seeder` 형식으로 명명
2. **파일명**: `[목적].seeder.ts` 형식으로 명명
3. **중복 방지**: 데이터 중복 생성을 방지하는 로직 포함
4. **의존성 확인**: 다른 시더에 의존하는 경우 명시적으로 확인
5. **환경 고려**: 개발/테스트용 시더는 프로덕션에서 실행되지 않도록 주의

## 프로젝트 설정

이 프로젝트에는 다음 파일들이 시더 실행을 위해 설정되어 있습니다:

- `mikro-orm.config.js`: MikroORM CLI용 설정 파일
- `package.json`: 시더 실행 스크립트
- `.env.template`: 환경변수 템플릿 