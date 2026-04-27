# 타임테이블 크롤링 전략

## 문제점

1. **인스타그램 크롤링 어려움**
   - 공식 API는 비즈니스 계정 필요 + 승인 과정
   - 비공식 스크래핑은 차단 위험
   - 로그인 필수

2. **타임테이블 이미지의 다양성**
   - 페스티벌마다 디자인이 다름
   - 글꼴, 색상, 레이아웃이 제각각
   - OCR 정확도 낮음

3. **데이터 정제 복잡성**
   - 시간 포맷 다양 (24시간/12시간)
   - 아티스트 이름 오타, 띄어쓰기
   - 스테이지 이름 불규칙

## 추천 방법: 3단계 하이브리드 접근

### Phase 1: 수동 관리자 UI (MVP)

**가장 현실적이고 빠른 방법**

```typescript
// 관리자 페이지에서 직접 입력
- 페스티벌 선택
- 날짜/시간/아티스트/스테이지 입력
- 한 번에 여러 공연 추가 (CSV 업로드)
```

**장점**:
- 즉시 구현 가능
- 정확도 100%
- 유지보수 쉬움

**단점**:
- 초기 데이터 입력에 시간 소요
- 대량 페스티벌 처리 시 부담

### Phase 2: OCR 보조 도구

**Google Vision API 또는 Tesseract 활용**

```typescript
// 1. 인스타그램에서 이미지 URL 수동 복사
// 2. 관리자 UI에서 이미지 업로드
// 3. OCR로 텍스트 추출
// 4. 사람이 검토/수정 후 저장
```

**구현 예시**:

```typescript
import vision from '@google-cloud/vision'

async function extractTimetableFromImage(imageUrl: string) {
  const client = new vision.ImageAnnotatorClient()
  const [result] = await client.textDetection(imageUrl)
  const detections = result.textAnnotations
  
  // 원시 텍스트 추출
  const rawText = detections[0]?.description || ''
  
  // 정규식으로 시간/아티스트 파싱
  const pattern = /(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})\s+(.+)/g
  const performances = []
  
  let match
  while ((match = pattern.exec(rawText)) !== null) {
    performances.push({
      startTime: match[1],
      endTime: match[2],
      artistName: match[3].trim(),
    })
  }
  
  return performances
}
```

### Phase 3: 커뮤니티 기여 (장기)

**사용자들이 데이터를 추가하는 방식**

- 사용자가 페스티벌/공연 정보 제출
- 관리자 승인 후 반영
- 포인트/배지 시스템으로 동기 부여

## 국내 주요 페스티벌 (2026년 4월 이전)

### 2025년 하반기 ~ 2026년 초

1. **지산 밸리 록 페스티벌** (7월)
   - 인스타: @jisanfestival
   - 홈페이지: https://www.valleyrockfestival.com

2. **펜타포트 록 페스티벌** (8월)
   - 인스타: @pentaport_rockfestival
   - 홈페이지: https://www.pentaportrock.com

3. **그랜드 민트 페스티벌** (10월)
   - 인스타: @grandmintfestival
   - 홈페이지: https://www.grandmintfestival.com

4. **서울재즈페스티벌** (5월)
   - 인스타: @seouljazzfestival

5. **뮤직페스트 인 서울** (연중)
   - 인스타: @musicfestinseoul

6. **롤링홀 페스티벌** (연중)
   - 인스타: @rollinghall

7. **언플러그드** (부산, 연중)
   - 인스타: @unplugged_busan

## 실용적 구현 계획

### 단계 1: 관리자 페이지 구축 (우선)

```bash
app/
├── admin/
│   ├── page.tsx              # 대시보드
│   ├── festivals/
│   │   └── new/
│   │       └── page.tsx      # 페스티벌 추가
│   └── performances/
│       ├── bulk-upload/
│       │   └── page.tsx      # CSV 일괄 업로드
│       └── ocr/
│           └── page.tsx      # OCR 보조 도구
```

**CSV 업로드 포맷**:

```csv
festivalId,artistName,startTime,endTime,stage
cmogrxwi20000lr7y3zhwodh7,Foo Fighters,2025-07-25 20:00,2025-07-25 21:30,Main Stage
cmogrxwi20000lr7y3zhwodh7,뱀파이어 위켄드,2025-07-25 18:00,2025-07-25 19:15,Main Stage
```

### 단계 2: OCR 통합 (선택)

**무료 옵션**: Tesseract.js (브라우저에서 실행)

```typescript
import Tesseract from 'tesseract.js'

async function scanTimetable(imageFile: File) {
  const { data: { text } } = await Tesseract.recognize(
    imageFile,
    'kor+eng',
    {
      logger: (m) => console.log(m),
    }
  )
  
  return parseTimetableText(text)
}
```

**유료 옵션**: Google Vision API ($1.50/1000 images)

### 단계 3: 반자동 워크플로우

1. 페스티벌 공식 SNS에서 타임테이블 이미지 찾기
2. 관리자 페이지에 이미지 업로드
3. OCR 자동 추출
4. 결과 검토 및 수정
5. 저장

## 인스타그램 크롤링 (참고용)

**비공식 방법 (비추천)**:

```typescript
// instaloader 같은 도구 사용 (Python)
// 하지만 차단 위험이 크고 불안정함

import { IgApiClient } from 'instagram-private-api'

async function getInstagramPosts(username: string) {
  const ig = new IgApiClient()
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD)
  
  const userId = await ig.user.getIdByUsername(username)
  const feed = ig.feed.user(userId)
  
  const posts = await feed.items()
  return posts.filter(post => 
    post.caption?.text.includes('타임테이블') ||
    post.caption?.text.includes('timetable')
  )
}
```

**공식 API (추천하지만 복잡)**:
- Meta Business Suite 필요
- 앱 검토 필수
- 제한적인 데이터 접근

## 최종 추천

### 초기 단계 (지금 당장)
1. **수동 입력** - 관리자 UI 구축
2. **CSV 업로드** - 엑셀로 정리 후 일괄 업로드
3. 10~15개 메이저 페스티벌 먼저 수집

### 중기 단계 (3~6개월)
1. OCR 보조 도구 추가
2. 커뮤니티 기여 시스템
3. 크라우드소싱

### 장기 단계 (1년+)
1. 페스티벌 주최측과 직접 협업
2. 공식 데이터 제공 받기
3. API 파트너십

## 실제 데이터 예시

### 2025 지산 밸리 록 페스티벌

**7월 25일 (금)**
- 20:00 - 21:30 | Foo Fighters | Main Stage
- 18:00 - 19:15 | 뱀파이어 위켄드 | Main Stage
- 16:00 - 17:00 | 새소년 | Valley Stage

**7월 26일 (토)**
- 21:00 - 22:30 | 너바나 | Main Stage
- 19:00 - 20:00 | 잔나비 | Main Stage

## 참고 자료

- [Setlist.fm](https://www.setlist.fm) - 공연 세트리스트 DB
- [Songkick API](https://www.songkick.com/developer) - 공연 정보 API
- [Bandsintown API](https://www.bandsintown.com/api/overview) - 투어 정보
