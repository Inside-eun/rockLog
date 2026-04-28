# Vercel 배포 단계별 가이드

## ⚠️ 중요: 반드시 이 순서대로 진행하세요!

### 1단계: GitHub 푸시

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2단계: Vercel 프로젝트 생성 (DB 없이)

1. https://vercel.com 접속
2. "Add New" → "Project"
3. GitHub 레포지토리 선택
4. **"Deploy" 버튼 누르지 말고** 먼저 환경 변수 설정:
   - `DATABASE_URL` = `file:./dev.db` (임시)
   - `KOPIS_API_KEY` = `0ab13d469d0442feba5260f45ebc93f5`
   - `GOOGLE_CLOUD_VISION_API_KEY` = `AIzaSyBNTuK2BtYH4MsZ2xFm3IoTuv_snx-mJeU`
5. 이제 "Deploy" 클릭

### 3단계: Postgres 데이터베이스 생성

1. Vercel 프로젝트 대시보드로 이동
2. 상단 "Storage" 탭 클릭
3. "Create Database" → "Postgres" 선택
4. 무료 플랜 선택 후 생성
5. **중요**: "Connect Project" 버튼을 눌러서 현재 프로젝트에 연결
   - 자동으로 환경 변수들이 추가됨:
     - `POSTGRES_URL`
     - `POSTGRES_PRISMA_URL` ← 이게 `DATABASE_URL`로 사용됨
     - `POSTGRES_URL_NON_POOLING`

### 4단계: Prisma Schema 업데이트

로컬에서:

```bash
# schema.prisma 수정
# provider를 postgresql로 변경
```

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# 변경사항 커밋 & 푸시
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push
```

### 5단계: 마이그레이션 실행

Vercel 프로젝트 대시보드에서:

1. "Settings" → "Environment Variables"
2. `DATABASE_URL` 값 확인 (Postgres URL로 자동 설정됨)
3. "Deployments" → 최신 배포 → "Redeploy"

또는 로컬에서 Vercel Postgres에 직접 마이그레이션:

```bash
# Vercel CLI 설치
npm i -g vercel

# Vercel 로그인
vercel login

# 환경 변수 가져오기
vercel env pull .env.production

# 프로덕션 DB에 마이그레이션
DATABASE_URL="$(grep POSTGRES_PRISMA_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy

# 데이터 가져오기
DATABASE_URL="$(grep POSTGRES_PRISMA_URL .env.production | cut -d '=' -f2-)" npm run db:import
```

### 6단계: 확인

배포된 사이트에 접속해서 페스티벌 데이터 확인!

---

## 더 간단한 방법: Vercel CLI 사용

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 링크
vercel link

# 4. Postgres 생성 (웹에서 수동으로 해야 함)
# → https://vercel.com/dashboard → Storage → Create

# 5. 환경 변수 확인
vercel env ls

# 6. 배포
vercel --prod
```

---

## 문제 해결

### Q: "Environment variable not found: DATABASE_URL" 오류
**원인**: Postgres를 먼저 생성하지 않았거나, 프로젝트에 연결하지 않았습니다.

**해결**:
1. Vercel Dashboard → Storage → Postgres 생성
2. "Connect Project" 버튼으로 프로젝트 연결
3. Redeploy

### Q: 로컬에서 개발할 때는?
로컬은 SQLite 그대로 사용:

```bash
# .env
DATABASE_URL="file:./dev.db"
```

Prisma는 자동으로 provider를 감지합니다.

### Q: 데이터가 안 보여요
마이그레이션은 됐지만 데이터 import를 안 했을 수 있습니다:

```bash
# Vercel 프로덕션 DB에 데이터 넣기
vercel env pull .env.production
DATABASE_URL="$(grep POSTGRES_PRISMA_URL .env.production | cut -d '=' -f2-)" npm run db:import
```
