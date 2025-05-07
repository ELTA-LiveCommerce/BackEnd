FROM node:22-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm@9.12.3

# 패키지 설치에 필요한 파일 복사
COPY package.json pnpm-lock.yaml ./

# 의존성 설치
RUN pnpm install

# 소스코드 복사
COPY . .

# 애플리케이션 빌드
RUN pnpm build

# 프로덕션 이미지
FROM node:22-alpine AS production

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm@9.12.3

# 패키지 설치에 필요한 파일 복사
COPY package.json pnpm-lock.yaml ./

# 프로덕션 의존성만 설치
RUN pnpm install --prod

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "dist/main"] 