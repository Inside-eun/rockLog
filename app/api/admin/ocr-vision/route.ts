import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseTimetableText } from '@/lib/timetable-parser'
import {
  reorderVisionText,
  type ReadingOrder,
  type VisionFullTextAnnotation,
} from '@/lib/vision-layout'

export const runtime = 'nodejs'
export const maxDuration = 60

interface VisionAnnotateResponse {
  responses: Array<{
    fullTextAnnotation?: VisionFullTextAnnotation
    textAnnotations?: Array<{ description: string }>
    error?: { code: number; message: string }
  }>
}

function parseReadingOrder(value: FormDataEntryValue | null): ReadingOrder {
  if (value === 'row' || value === 'column') return value
  return 'auto'
}

function parseColumnCount(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string') return 1
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return 1
  return Math.min(8, Math.max(1, n))
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GOOGLE_CLOUD_VISION_API_KEY가 설정되지 않았습니다. .env 파일에 키를 추가하고 dev 서버를 재시작하세요.',
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const festivalId = formData.get('festivalId') as string | null
    const file = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null
    const readingOrder = parseReadingOrder(formData.get('readingOrder'))
    const columnCount = parseColumnCount(formData.get('columnCount'))

    if (!file && !imageUrl) {
      return NextResponse.json(
        { error: '이미지 파일 또는 URL이 필요합니다' },
        { status: 400 }
      )
    }

    let defaultDate: string | undefined
    if (festivalId) {
      const festival = await prisma.festival.findUnique({
        where: { id: festivalId },
      })
      if (festival) {
        defaultDate = festival.startDate.toISOString().slice(0, 10)
      }
    }

    let imagePayload: { content?: string; source?: { imageUri: string } }
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      imagePayload = { content: buffer.toString('base64') }
    } else {
      imagePayload = { source: { imageUri: imageUrl as string } }
    }

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: imagePayload,
              features: [
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
              ],
              imageContext: { languageHints: ['ko', 'en'] },
            },
          ],
        }),
      }
    )

    if (!visionRes.ok) {
      const text = await visionRes.text()
      return NextResponse.json(
        { error: 'Cloud Vision API 호출 실패', details: text },
        { status: 500 }
      )
    }

    const data: VisionAnnotateResponse = await visionRes.json()
    const first = data.responses?.[0]

    if (first?.error) {
      return NextResponse.json(
        {
          error: 'Cloud Vision 오류',
          details: first.error.message,
        },
        { status: 500 }
      )
    }

    const annotation = first?.fullTextAnnotation
    const fallbackText =
      annotation?.text || first?.textAnnotations?.[0]?.description || ''

    if (!fallbackText) {
      return NextResponse.json(
        {
          error: '이미지에서 텍스트를 찾지 못했습니다',
          rawText: '',
          performances: [],
        },
        { status: 200 }
      )
    }

    const rawText = annotation
      ? reorderVisionText(annotation, readingOrder, columnCount)
      : fallbackText

    const { performances, unparsedLines } = parseTimetableText(
      rawText,
      defaultDate
    )

    const noteParts: string[] = []
    if (readingOrder === 'column') {
      noteParts.push(`컬럼 우선 정렬 적용 (${columnCount}컬럼)`)
    } else if (readingOrder === 'row') {
      noteParts.push('행 우선 정렬 적용')
    }
    if (unparsedLines.length > 0) {
      noteParts.push(`파싱하지 못한 줄 ${unparsedLines.length}개 — 직접 확인 필요`)
    }

    return NextResponse.json({
      rawText,
      performances,
      unparsedLines,
      readingOrder,
      columnCount,
      notes: noteParts.length > 0 ? noteParts.join(' / ') : null,
    })
  } catch (error) {
    console.error('Vision OCR error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Vision OCR 실패', details: message },
      { status: 500 }
    )
  }
}
