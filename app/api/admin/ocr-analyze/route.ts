import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ExtractedPerformance {
  artistName: string
  startTime: string | null
  endTime: string | null
  stage: string | null
  date: string | null
}

interface VisionResult {
  festivalName: string | null
  performances: ExtractedPerformance[]
  notes: string | null
}

const SYSTEM_PROMPT = `너는 페스티벌 타임테이블 이미지를 정확히 읽어서 구조화된 JSON으로 변환하는 전문가야.

규칙:
1. 이미지에 보이는 모든 공연을 빠짐없이 추출
2. 시간은 24시간 형식 "HH:mm" (예: "20:30")
3. 날짜는 "YYYY-MM-DD" 형식
4. 종료시간이 명시되지 않았으면 다음 공연 시작시간을 종료시간으로 추론, 마지막 공연이면 startTime + 60분
5. "DAY 1", "1일차", "Friday" 같은 상대 표기는 사용자가 알려준 페스티벌 시작일 기준으로 환산
6. 자정 넘어가는 공연(예: 23:00~01:00)도 정확히 처리
7. 아티스트 이름은 이미지의 표기 그대로 (한글/영문 유지)
8. 스테이지 이름이 없으면 null
9. 글씨가 너무 작거나 흐려서 못 읽으면 그 항목은 빼고 notes에 적기
10. 반드시 JSON만 응답 (설명 추가 금지)

응답 스키마:
{
  "festivalName": "페스티벌 이름 또는 null",
  "performances": [
    {
      "artistName": "아티스트명",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "stage": "스테이지명 또는 null",
      "date": "YYYY-MM-DD"
    }
  ],
  "notes": "읽기 어려웠던 부분이나 추가 정보"
}`

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OPENAI_API_KEY가 설정되지 않았습니다. .env 파일에 키를 추가하고 dev 서버를 재시작하세요.',
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const festivalId = formData.get('festivalId') as string | null
    const file = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null

    if (!file && !imageUrl) {
      return NextResponse.json(
        { error: '이미지 파일 또는 URL이 필요합니다' },
        { status: 400 }
      )
    }

    let festivalContext = ''
    if (festivalId) {
      const festival = await prisma.festival.findUnique({
        where: { id: festivalId },
      })
      if (festival) {
        festivalContext = `\n참고 정보:\n- 페스티벌명: ${festival.name}\n- 시작일: ${festival.startDate.toISOString().slice(0, 10)}\n- 종료일: ${festival.endDate.toISOString().slice(0, 10)}\n`
      }
    }

    let imageContent: { type: 'image_url'; image_url: { url: string } }
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mime = file.type || 'image/jpeg'
      imageContent = {
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${base64}` },
      }
    } else {
      imageContent = {
        type: 'image_url',
        image_url: { url: imageUrl as string },
      }
    }

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 페스티벌 타임테이블 이미지를 JSON으로 추출해줘.${festivalContext}`,
            },
            imageContent,
          ],
        },
      ],
      max_tokens: 4096,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json(
        { error: 'AI 응답이 비어있습니다' },
        { status: 500 }
      )
    }

    let parsed: VisionResult
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json(
        { error: 'AI 응답을 JSON으로 파싱하지 못했습니다', raw },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...parsed,
      usage: completion.usage,
    })
  } catch (error) {
    console.error('OCR analyze error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: '이미지 분석 실패', details: message },
      { status: 500 }
    )
  }
}
