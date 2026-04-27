import { NextResponse } from 'next/server'
import { parseTimetableText } from '@/lib/timetable-parser'
import {
  reorderVisionText,
  type ReadingOrder,
  type VisionFullTextAnnotation,
} from '@/lib/vision-layout'

export const runtime = 'nodejs'

function parseReadingOrder(value: unknown): ReadingOrder {
  if (value === 'row' || value === 'column') return value
  return 'auto'
}

function parseColumnCount(value: unknown): number {
  if (typeof value !== 'number') return 1
  return Math.min(8, Math.max(1, Math.round(value)))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { annotation, readingOrder, columnCount, defaultDate } = body as {
      annotation?: VisionFullTextAnnotation
      readingOrder?: unknown
      columnCount?: unknown
      defaultDate?: string
    }

    if (!annotation) {
      return NextResponse.json(
        { error: 'annotation이 필요합니다' },
        { status: 400 }
      )
    }

    const order = parseReadingOrder(readingOrder)
    const count = parseColumnCount(columnCount)

    const rawText = reorderVisionText(annotation, order, count)
    const { performances, unparsedLines } = parseTimetableText(rawText, defaultDate)

    const noteParts: string[] = []
    if (order === 'column') noteParts.push(`컬럼 우선 정렬 (${count}컬럼)`)
    else if (order === 'row') noteParts.push('행 우선 정렬')
    if (unparsedLines.length > 0) noteParts.push(`파싱 실패 ${unparsedLines.length}줄`)

    return NextResponse.json({
      rawText,
      performances,
      unparsedLines,
      readingOrder: order,
      columnCount: count,
      notes: noteParts.length > 0 ? noteParts.join(' / ') : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: '재정렬 실패', details: message },
      { status: 500 }
    )
  }
}
