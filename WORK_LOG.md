# rockLog 작업 로그

## 프로젝트 개요

페스티벌 타임테이블을 이미지로 업로드하면 AI가 공연 정보를 추출하고, 관람한 공연을 기록·통계화하는 앱.

- **스택**: Next.js, Prisma, SQLite
- **DB 모델**: Festival → Performance → UserLog
- **주요 페이지**: `/admin/performances/ocr` (타임테이블 스캔 및 저장)

---

## 현재 아키텍처

### OCR 흐름 (두 가지 엔진)

```
이미지 업로드
    │
    ├─ [Google Vision 엔진] ──────────────────────────────────────────┐
    │   Cloud Vision API → 텍스트 추출 → vision-layout.ts(컬럼 재정렬)  │
    │   → timetable-parser.ts(정규식 파싱) → 추출 결과                  │
    │   └─ 파싱 실패 시 → "GPT로 재해석" 버튼 → ocr-refine (GPT-4o mini) │
    │                                                                 │
    └─ [OpenAI 엔진] ─────────────────────────────────────────────────┘
        이미지 자체를 GPT-4o Vision에 전송 → 구조화 JSON 직접 반환

        → 공통: 수정 가능한 테이블 UI → 저장
```

### 환경변수 (.env)

| 변수 | 상태 | 용도 |
|------|------|------|
| `DATABASE_URL` | ✅ 설정됨 | SQLite |
| `GOOGLE_CLOUD_VISION_API_KEY` | ✅ 설정됨 | 텍스트 OCR |
| `KOPIS_API_KEY` | ✅ 설정됨 | 공연 정보 크롤링 |
| `OPENAI_API_KEY` | ❌ **미설정** | GPT-4o Vision / GPT-4o mini |

---

## 오늘 수정한 내용

### 1. `lib/timetable-parser.ts` — `40min` 노이즈 처리

**문제**: OCR이 `40min`, `60min+` 같은 공연 시간 표기를 별도 줄로 분리하면 아티스트 이름으로 오인식.

**수정**: `NOISE_PATTERNS`에 패턴 추가.

```ts
/^\d+\s*min$/i  // 40min, 60min, 60 MIN 등 무시
```

### 2. `app/admin/performances/ocr/page.tsx` — 파싱 실패 줄 UI 표시

**문제**: API가 `unparsedLines`(파싱 못 한 줄 목록)를 반환하는데 UI에서 전혀 표시하지 않아 정보가 조용히 사라짐.

**수정**:
- `unparsedLines` state 추가
- 세 핸들러(`handleAnalyze`, `handleReorder`, `handleRefineWithGPT`) 모두에서 `setUnparsedLines` 호출
- 결과 테이블 아래에 노란 패널로 표시

```
파싱 실패 줄 (N개)
┌─────────────────────────────────┬────────┬───┐
│ N.Flying                        │ 행 추가 │ × │
│ 60min +                         │ 행 추가 │ × │
└─────────────────────────────────┴────────┴───┘
```

- "행 추가": 해당 텍스트를 아티스트명으로 채운 빈 행을 테이블에 추가
- "×": 노이즈로 판단하여 무시

---

## 핵심 문제: 정규식의 한계

### 정규식이 잘 처리하는 타입

```
아티스트명
(12:00~13:00)
```
또는
```
12:00 - 13:00 아티스트명
```

### 정규식이 실패하는 타입 (이번 Vivid Planet 같은 경우)

```
N.Flying          ← 영어명
엔 플라잉          ← 한글명  
60min +           ← 공연 시간 (별도 줄)
20 : 30-          ← 시작시간만 있고 종료시간 없음
```

→ OCR은 색상 블록 경계를 모르고, 정규식은 "이 4줄이 하나의 아티스트"임을 맥락 없이 알 수 없음.

---

## 엔진 선택 가이드

| 타임테이블 유형 | 권장 엔진 | 비용 |
|----------------|-----------|------|
| 텍스트 위주, 단순 레이아웃 | Google Vision + 정규식 | 월 1,000건 무료 |
| 색상 블록/카드 디자인 | **OpenAI GPT-4o Vision** | ~$0.01/장 |
| Google Vision 후 오류 많을 때 | Google Vision → "GPT로 재해석" | ~$0.001/회 |

---

## 내일 할 일 (OpenAI 결제 후)

### 1단계: API 키 설정

```bash
# rockLog/.env 에 추가
OPENAI_API_KEY="sk-..."
```

이후 dev 서버 재시작 (`npm run dev`).

### 2단계: 밀린 페스티벌 타임테이블 입력

1. `/admin/performances/ocr` 접속
2. **시각 디자인 타임테이블** (Vivid Planet 등): `OpenAI GPT-4o Vision` 엔진 선택
3. **단순 텍스트 타임테이블**: `Google Vision` 선택 → 오류 많으면 "GPT로 재해석" 버튼
4. 결과 테이블 검토 → 파싱 실패 줄 패널에서 필요한 것 추가 → 저장

### 3단계: 향후 고려 사항 (우선순위 낮음)

- `20:30-` 처럼 종료시간 없는 케이스: 현재 빈칸으로 저장됨. 필요하면 다음 공연 시작시간을 종료시간으로 자동 채우는 로직 추가 가능
- 아티스트명 OCR 오류 (공백 삽입 등): `손 을 모아` → `손을모아` 같은 후처리는 GPT 엔진이 자동으로 정리함
- Google Vision 정규식 파서 추가 개선은 ROI가 낮음. GPT 엔진 우선 활용 권장

---

## 파일 구조 참고

```
rockLog/
├── app/
│   ├── admin/performances/ocr/page.tsx   ← 메인 작업 페이지
│   └── api/admin/
│       ├── ocr-vision/route.ts           ← Google Vision + 정규식
│       ├── ocr-analyze/route.ts          ← GPT-4o Vision (이미지 직접)
│       ├── ocr-refine/route.ts           ← GPT-4o mini (텍스트 재해석)
│       └── ocr-reorder/route.ts          ← Vision 결과 컬럼 재정렬
├── lib/
│   ├── timetable-parser.ts               ← 정규식 파서 (오늘 수정)
│   └── vision-layout.ts                  ← 컬럼 우선 읽기 순서 처리
└── prisma/schema.prisma                  ← DB: Festival, Performance, UserLog
```
