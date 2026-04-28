# Vercel 배포 단계별 가이드

## ⚠️ 중요: 반드시 이 순서대로 진행하세요!

### 1단계: GitHub 푸시

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2단계: Vercel Storage에서 Postgres 먼저 생성

⚠️ **중요: 프로젝트 배포 전에 먼저 Postgres를 만드세요!**

1. https://vercel.com/dashboard 접속
2. 좌측 "Storage" 메뉴 클릭
3. "Create Database" → "Postgres" 선택
4. 데이터베이스 이름 입력 (예: `memo-db`)
5. 리전 선택 후 생성

### 3단계: Vercel 프로젝트 생성 및 DB 연결

1. "Add New" → "Project"
2. GitHub 레포지토리 선택
3. **"Deploy" 버튼 누르지 말고** 설정:
   - "Environment Variables" 섹션에서:
     - Storage 탭에서 방금 만든 Postgres 선택 → "Connect" (자동으로 DATABASE_URL 등 추가됨)
     - 추가로 수동 입력:
       - `KOPIS_API_KEY` = `0ab13d469d0442feba5260f45ebc93f5`
       - `GOOGLE_CLOUD_VISION_API_KEY` = `AIzaSyBNTuK2BtYH4MsZ2xFm3IoTuv_snx-mJeU`
4. 이제 "Deploy" 클릭

### 4단계: 배포 확인

첫 배포가 성공하면:

1. Vercel 대시보드 → 프로젝트 → "Deployments" 에서 로그 확인
2. 빌드 성공 확인

### 5단계: Prisma Schema를 PostgreSQL로 업데이트

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
