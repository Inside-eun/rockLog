/**
 * Google Vision DOCUMENT_TEXT_DETECTION 응답을 좌표 기반으로 재정렬한다.
 *
 * 페스티벌 타임테이블처럼 표/컬럼 레이아웃 이미지에서는 Google이 자동으로
 * 정해주는 읽기 순서가 기대와 다르게 동작할 수 있다(한 컬럼을 다 읽다가
 * 갑자기 다른 컬럼으로 점프 등). 이 모듈은 Vision이 반환한 boundingBox 좌표를
 * 활용해 사용자가 원하는 방향으로 텍스트를 재정렬한다.
 */

interface VisionVertex {
  x?: number
  y?: number
}

interface VisionBoundingBox {
  vertices?: VisionVertex[]
}

interface VisionSymbol {
  text?: string
  property?: {
    detectedBreak?: {
      type?: string
    }
  }
}

interface VisionWord {
  boundingBox?: VisionBoundingBox
  symbols?: VisionSymbol[]
}

interface VisionParagraph {
  words?: VisionWord[]
}

interface VisionBlock {
  paragraphs?: VisionParagraph[]
}

interface VisionPage {
  width?: number
  height?: number
  blocks?: VisionBlock[]
}

export interface VisionFullTextAnnotation {
  text?: string
  pages?: VisionPage[]
}

export type ReadingOrder = 'auto' | 'row' | 'column'

interface ExtractedWord {
  text: string
  x: number
  y: number
  height: number
}

function centerOf(vertices: VisionVertex[] | undefined): { x: number; y: number; height: number } {
  if (!vertices || vertices.length === 0) return { x: 0, y: 0, height: 0 }
  const xs = vertices.map((v) => v.x ?? 0)
  const ys = vertices.map((v) => v.y ?? 0)
  const x = xs.reduce((a, b) => a + b, 0) / xs.length
  const y = ys.reduce((a, b) => a + b, 0) / ys.length
  const height = Math.max(...ys) - Math.min(...ys)
  return { x, y, height }
}

function extractWords(annotation: VisionFullTextAnnotation): {
  words: ExtractedWord[]
  imageWidth: number
} {
  const words: ExtractedWord[] = []
  let imageWidth = 0

  for (const page of annotation.pages ?? []) {
    if (page.width && page.width > imageWidth) imageWidth = page.width
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const text = (word.symbols ?? [])
            .map((s) => s.text ?? '')
            .join('')
            .trim()
          if (!text) continue
          const { x, y, height } = centerOf(word.boundingBox?.vertices)
          words.push({ text, x, y, height })
        }
      }
    }
  }

  return { words, imageWidth }
}

function groupIntoLines(words: ExtractedWord[], heightThreshold = 0.6): string[] {
  if (words.length === 0) return []

  const sorted = [...words].sort((a, b) => a.y - b.y || a.x - b.x)

  const avgHeight =
    sorted.reduce((s, w) => s + (w.height || 20), 0) / sorted.length
  const yThreshold = avgHeight * heightThreshold

  const lines: ExtractedWord[][] = []
  let currentLine: ExtractedWord[] = []
  let currentY = -Infinity

  for (const word of sorted) {
    if (
      currentLine.length === 0 ||
      Math.abs(word.y - currentY) <= yThreshold
    ) {
      currentLine.push(word)
      currentY =
        currentLine.reduce((s, w) => s + w.y, 0) / currentLine.length
    } else {
      lines.push(currentLine)
      currentLine = [word]
      currentY = word.y
    }
  }
  if (currentLine.length > 0) lines.push(currentLine)

  return lines.map((line) =>
    [...line]
      .sort((a, b) => a.x - b.x)
      .map((w) => w.text)
      .join(' ')
  )
}

function splitIntoColumns(
  words: ExtractedWord[],
  columnCount: number,
  imageWidth: number
): ExtractedWord[][] {
  if (columnCount <= 1) return [words]

  const xs = words.map((w) => w.x).filter((x) => x > 0)
  const minX = xs.length > 0 ? Math.min(...xs) : 0
  const maxX = xs.length > 0 ? Math.max(...xs) : imageWidth || 1000
  const usableWidth = Math.max(1, maxX - minX)

  const columns: ExtractedWord[][] = Array.from(
    { length: columnCount },
    () => []
  )

  for (const word of words) {
    const ratio = (word.x - minX) / usableWidth
    const idx = Math.min(columnCount - 1, Math.max(0, Math.floor(ratio * columnCount)))
    columns[idx].push(word)
  }

  return columns
}

/**
 * Vision의 fullTextAnnotation을 받아 readingOrder에 따라 텍스트를 재정렬한다.
 *
 * - 'auto': Vision이 반환한 원본 text 그대로 사용
 * - 'row': 모든 단어를 줄 단위로 묶어 위→아래, 좌→우 순서로 (가로 방향 표)
 * - 'column': 이미지를 columnCount개의 세로 컬럼으로 나누고, 각 컬럼 안에서
 *   위→아래로 읽음. 페스티벌 타임테이블처럼 스테이지별 세로 정렬 표에 적합.
 */
export function reorderVisionText(
  annotation: VisionFullTextAnnotation,
  readingOrder: ReadingOrder,
  columnCount = 1
): string {
  if (readingOrder === 'auto') {
    return annotation.text ?? ''
  }

  const { words, imageWidth } = extractWords(annotation)
  if (words.length === 0) return annotation.text ?? ''

  if (readingOrder === 'row') {
    return groupIntoLines(words).join('\n')
  }

  const columns = splitIntoColumns(
    words,
    Math.max(1, Math.min(8, columnCount)),
    imageWidth
  )

  const result: string[] = []
  columns.forEach((colWords, idx) => {
    if (colWords.length === 0) return
    if (idx > 0) result.push(`--- 컬럼 ${idx + 1} ---`)
    else result.push(`--- 컬럼 ${idx + 1} ---`)
    result.push(...groupIntoLines(colWords))
  })

  return result.join('\n')
}
