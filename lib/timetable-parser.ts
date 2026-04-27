export interface ParsedPerformance {
  artistName: string
  startTime: string | null
  endTime: string | null
  stage: string | null
  date: string | null
}

export interface ParsedTimetable {
  performances: ParsedPerformance[]
  unparsedLines: string[]
}

const PAREN_TIME_RANGE =
  /^[(\[]?\s*(\d{1,2})\s*:\s*(\d{2})\s*[-~–—]\s*(\d{1,2})\s*:\s*(\d{2})\s*[)\]]?\s*(?:[-~–—.]\s*\d+\s*min)?\s*$/
const SPACE_TIME_RANGE =
  /^(\d{1,2})\s*:\s*(\d{2})\s+(\d{1,2})\s*:\s*(\d{2})\s*[-~–—.]\s*\d+\s*min\s*$/
const INLINE_TIME_TEXT_REGEX =
  /^(\d{1,2})\s*:\s*(\d{2})\s*[-~–—]\s*(\d{1,2})\s*:\s*(\d{2})\s+(.+)$/

const COLUMN_DIVIDER = /^---\s*컬럼\s*\d+\s*---$/

const NOISE_PATTERNS: RegExp[] = [
  /^\d{1,2}$/,
  /^[+◆●▲★※○◇□]+$/,
  /^\d{4}$/,
  /^[\d./\-:]+$/,
  /^\d{1,2}\s*:\s*\d{2}$/,
  /^\d+\s*min$/i,
]

const META_KEYWORDS: RegExp[] = [
  /^TIME\s*TABLE$/i,
  /FESTIVAL/i,
  /^(SAT|SUN|MON|TUE|WED|THU|FRI)$/i,
  /^\d{2}\.\d{2}\.(SAT|SUN|MON|TUE|WED|THU|FRI)/i,
]

function isNoise(line: string): boolean {
  if (line.length < 1) return true
  return NOISE_PATTERNS.some((p) => p.test(line))
}

function isMeta(line: string): boolean {
  return META_KEYWORDS.some((p) => p.test(line))
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function normalizeTime(h: string, m: string): string {
  const hour = Math.min(23, Math.max(0, parseInt(h, 10)))
  const min = Math.min(59, Math.max(0, parseInt(m, 10)))
  return `${pad(hour)}:${pad(min)}`
}

function looksLikeArtistName(line: string): boolean {
  if (line.length < 2 || line.length > 40) return false
  if (PAREN_TIME_RANGE.test(line)) return false
  if (SPACE_TIME_RANGE.test(line)) return false
  if (INLINE_TIME_TEXT_REGEX.test(line)) return false
  if (isNoise(line)) return false
  if (isMeta(line)) return false
  return true
}

/**
 * Vision OCR 결과(읽기 방향 적용 후)를 받아 공연 정보를 추출.
 *
 * 컬럼 구조 인식:
 *  - "--- 컬럼 N ---" 구분선은 무시 (단, 새 컬럼 시작 신호로 사용)
 *  - 새 컬럼 시작 후 첫 시간 패턴이 나오기 전까지의 라인들을 모두 모아
 *    스테이지 이름으로 합침 (단, 시간 패턴 직전 라인은 첫 아티스트로 사용)
 *    예: "JOSE CUERVO\nX\nHERO STAGE\n피싱 걸스\n(10:30~11:10)"
 *        → stage="JOSE CUERVO X HERO STAGE", artist="피싱 걸스", time=10:30~11:10
 *
 * 본문 매칭:
 *  - "아티스트명\n(HH:mm ~ HH:mm)" 두 줄 한 덩어리
 *  - "HH:mm ~ HH:mm 아티스트명" 한 줄
 */
export function parseTimetableText(
  rawText: string,
  defaultDate?: string
): ParsedTimetable {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const performances: ParsedPerformance[] = []
  const unparsedLines: string[] = []
  const artistQueue: string[] = []
  let currentStage: string | null = null
  let pendingStageLines: string[] = []
  let collectingStage = true

  const flushQueueAsUnparsed = () => {
    while (artistQueue.length > 0) {
      const leftover = artistQueue.shift()
      if (leftover) unparsedLines.push(`[시간 매칭 안 됨] ${leftover}`)
    }
  }

  const finalizeStage = () => {
    if (!collectingStage) return
    const lastLine = pendingStageLines.pop()
    const stageName = pendingStageLines.join(' ').replace(/\s+/g, ' ').trim()
    if (stageName) currentStage = stageName
    if (lastLine) artistQueue.push(lastLine)
    pendingStageLines = []
    collectingStage = false
  }

  for (const line of lines) {
    if (COLUMN_DIVIDER.test(line)) {
      flushQueueAsUnparsed()
      pendingStageLines = []
      collectingStage = true
      continue
    }

    const inline = line.match(INLINE_TIME_TEXT_REGEX)
    if (inline) {
      finalizeStage()
      const [, h1, m1, h2, m2, name] = inline
      performances.push({
        artistName: name.replace(/^[|·\-•~]+/, '').trim(),
        startTime: normalizeTime(h1, m1),
        endTime: normalizeTime(h2, m2),
        stage: currentStage,
        date: defaultDate || null,
      })
      continue
    }

    const paren = line.match(PAREN_TIME_RANGE)
    if (paren) {
      finalizeStage()
      const [, h1, m1, h2, m2] = paren
      const artistName = artistQueue.shift() || '(미확인)'
      performances.push({
        artistName,
        startTime: normalizeTime(h1, m1),
        endTime: normalizeTime(h2, m2),
        stage: currentStage,
        date: defaultDate || null,
      })
      continue
    }

    const spaceTime = line.match(SPACE_TIME_RANGE)
    if (spaceTime) {
      finalizeStage()
      const [, h1, m1, h2, m2] = spaceTime
      const artistName = artistQueue.shift() || '(미확인)'
      performances.push({
        artistName,
        startTime: normalizeTime(h1, m1),
        endTime: normalizeTime(h2, m2),
        stage: currentStage,
        date: defaultDate || null,
      })
      continue
    }

    if (collectingStage) {
      pendingStageLines.push(line)
      continue
    }

    if (looksLikeArtistName(line)) {
      artistQueue.push(line)
    } else if (!isNoise(line) && !isMeta(line)) {
      unparsedLines.push(line)
    }
  }

  flushQueueAsUnparsed()

  return { performances, unparsedLines }
}
