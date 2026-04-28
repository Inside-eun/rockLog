# 배포 가이드

## 1. 현재 데이터 백업

```bash
npm run db:export
```

이 명령어는 `prisma/exported-data.json`에 모든 페스티벌, 공연, 사용자 로그를 저장합니다.

## 2. Vercel Postgres 설정

### 2-1. Vercel 프로젝트 생성
1. https://vercel.com 접속 및 로그인
2. "Add New" → "Project" 클릭
3. GitHub 레포지토리 연결

### 2-2. Postgres 데이터베이스 추가
1. Vercel 프로젝트 대시보드 → "Storage" 탭
2. "Create Database" → "Postgres" 선택
3. 무료 플랜(Hobby) 선택
4. 데이터베이스 이름 입력 후 생성

### 2-3. 환경 변수 자동 연결
- Vercel이 자동으로 `DATABASE_URL` 등을 프로젝트에 추가합니다
- 추가로 필요한 환경 변수:
  - `OPENAI_API_KEY` (있는 경우)
  - `GOOGLE_CLOUD_VISION_API_KEY`
  - `KOPIS_API_KEY`

## 3. Prisma Schema 업데이트

`.env` 파일:
```bash
# 로컬 개발용
DATABASE_URL="file:./dev.db"

# 프로덕션용 (Vercel에서 자동 설정됨)
# DATABASE_URL="postgres://..."
```

`prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // sqlite에서 postgresql로 변경
  url      = env("DATABASE_URL")
}
```

## 4. 마이그레이션 및 배포

### 로컬에서 테스트 (optional)
```bash
# Vercel Postgres에 연결해서 테스트
npx prisma migrate deploy
npm run db:import
```

### Vercel 배포
```bash
git add .
git commit -m "Add Vercel Postgres support"
git push
```

Vercel이 자동으로:
1. Prisma 마이그레이션 실행 (`prisma migrate deploy`)
2. 데이터 가져오기 (`npm run db:import`)
3. Next.js 빌드

## 5. 배포 후 확인

배포된 사이트에 접속해서 페스티벌 데이터가 잘 보이는지 확인하세요.

---

## 대안: Turso (SQLite 클라우드)

SQLite를 그대로 사용하고 싶다면 Turso 사용:

```bash
# Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# 데이터베이스 생성
turso db create memo-db

# URL 확인
turso db show memo-db --url
turso db tokens create memo-db
```

`.env`:
```bash
DATABASE_URL="libsql://memo-db-[username].turso.io"
DATABASE_AUTH_TOKEN="eyJ..."
```

`prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

---

## 문제 해결

### Q: 배포 후 데이터가 안 보여요
- Vercel 대시보드 → "Deployments" → 최근 배포 로그 확인
- `npm run db:import` 로그 확인

### Q: 로컬에서 개발할 때는?
- SQLite 그대로 사용 (`DATABASE_URL="file:./dev.db"`)
- PostgreSQL과 호환되도록 코드 작성
