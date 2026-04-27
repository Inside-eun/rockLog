# Festival Tracker - 공연 기록 플랫폼

페스티벌과 공연 관람 기록을 한 곳에서 관리하는 웹 애플리케이션

## 주요 기능

### 사용자 기능
- 🎪 국내 페스티벌 정보 조회 (장르별/검색)
- 🎵 타임테이블로 공연 선택 및 기록
- ⏱️ 관람 시간 자동 계산
- 📊 관람 통계 대시보드 (차트, 아티스트 목록)
- 💾 localStorage 기반 데이터 저장

### 관리자 기능
- ➕ 페스티벌 추가/관리
- 🎤 개별 공연 추가
- 📊 CSV 일괄 업로드
- 📷 OCR 타임테이블 스캔 (실험적)

## 기술 스택

- **프론트엔드**: Next.js 15, TypeScript, Tailwind CSS
- **데이터베이스**: SQLite (개발), PostgreSQL (프로덕션)
- **ORM**: Prisma
- **차트**: Recharts
- **스크래핑**: Puppeteer
- **배포**: Vercel

## 빠른 시작

```bash
# 패키지 설치
npm install

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 시드 데이터 생성 (예시 페스티벌)
npm run db:seed

# 개발 서버 실행
npm run dev
```

서버 실행 후 http://localhost:3000 접속

## 주요 페이지

- `/` - 페스티벌 목록 (필터, 검색)
- `/festivals/[id]` - 페스티벌 상세 & 타임테이블
- `/stats` - 관람 통계 대시보드
- `/admin` - 관리자 페이지 (데이터 추가)

## 타임테이블 데이터 수집 방법

### 방법 1: CSV 업로드 (추천)

1. 엑셀이나 구글 스프레드시트로 타임테이블 정리
2. CSV 형식으로 저장
3. `/admin/performances/bulk-upload`에서 업로드

**CSV 형식 예시:**
```csv
artistName,startTime,endTime,stage
Foo Fighters,2025-07-25 20:00,2025-07-25 21:30,Main Stage
뱀파이어 위켄드,2025-07-25 18:00,2025-07-25 19:15,Main Stage
```

### 방법 2: 수동 입력

1. `/admin/festivals/new`에서 페스티벌 추가
2. `/admin/performances/add`에서 공연 하나씩 추가

### 방법 3: OCR (실험적)

1. 페스티벌 인스타그램에서 타임테이블 이미지 찾기
2. `/admin/performances/ocr`에서 이미지 URL 입력
3. 추출된 텍스트 검토 후 CSV로 변환

자세한 내용은 [TIMETABLE_CRAWLING_STRATEGY.md](TIMETABLE_CRAWLING_STRATEGY.md) 참고

## 데이터베이스 스키마

```
Festival (페스티벌)
├── id
├── name
├── startDate / endDate
├── location
├── genre
├── imageUrl
└── performances (1:N)

Performance (공연)
├── id
├── festivalId (FK)
├── artistName
├── startTime / endTime
├── stage
└── durationMinutes

UserLog (관람기록) - localStorage에 저장
├── performanceId
└── watchedAt
```

## 개발 로드맵

- [x] Phase 1: 프로젝트 셋업
- [x] Phase 2: 데이터베이스 설정
- [x] Phase 3: 페스티벌 목록/상세 페이지
- [x] Phase 4: 관람 기록 기능 (localStorage)
- [x] Phase 5: 통계 대시보드
- [x] Phase 6: 관리자 페이지 (데이터 추가)
- [ ] Phase 7: 스크래핑 자동화
- [ ] Phase 8: 사용자 인증 (NextAuth.js)

## 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run db:seed      # 시드 데이터 생성
npm run scrape       # 페스티벌 스크래핑 (개발 중)
```

## 국내 주요 페스티벌 목록

자세한 내용은 [FESTIVALS_DATABASE.md](FESTIVALS_DATABASE.md) 참고

- 지산 밸리 록 페스티벌 (7월)
- 펜타포트 록 페스티벌 (8월)
- 그랜드 민트 페스티벌 (10월)
- 서울재즈페스티벌 (5월)
- World DJ Festival (6월)
- 그 외 다수

## 프로젝트 구조

```
memo/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 홈/페스티벌 목록
│   ├── festivals/[id]/      # 페스티벌 상세
│   ├── stats/               # 통계 대시보드
│   ├── admin/               # 관리자 페이지
│   └── api/                 # API Routes
├── components/              # React 컴포넌트
├── lib/                     # 유틸리티
│   ├── db.ts               # Prisma 클라이언트
│   ├── storage.ts          # localStorage 유틸
│   └── scraper.ts          # 스크래핑 로직
├── prisma/
│   ├── schema.prisma       # 데이터베이스 스키마
│   └── seed.ts             # 시드 데이터
└── scripts/                # 스크립트
    └── example-timetable.csv
```

## 향후 계획

- 더 많은 페스티벌 데이터 추가
- 사용자 인증 및 DB 저장
- 모바일 최적화
- PWA 지원
- 소셜 기능 (친구, 공유)
- 페스티벌 추천 알고리즘
