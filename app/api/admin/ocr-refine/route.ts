import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM_PROMPT = `너는 페스티벌 타임테이블 OCR 텍스트를 정확한 구조화 JSON으로 변환하는 전문가야.

OCR로 추출된 텍스트는 페스티벌 타임테이블 이미지에서 나온 거라, 보통 다음과 같은 패턴이 섞여 있어:
- 컬럼식 레이아웃 (스테이지별 세로 정렬)이라 OCR이 한 컬럼을 다 읽고 다음 컬럼으로 넘어감
- "아티스트명" 다음 줄에 "(10:00~10:30)" 형식의 시간이 오는 경우가 많음
- 단순 숫자 ("10", "11", "12"...)는 시간축 헤더일 뿐, 무시
- "X", "+", "◆" 같은 장식/노이즈 무시
- "STAGE" 또는 "스테이지"가 들어간 줄은 스테이지 헤더 (해당 컬럼의 모든 공연이 그 스테이지)
- "TIME TABLE", "FESTIVAL", 후원사 이름, 날짜, 요일은 메타 정보, 무시

규칙:
1. 모든 공연을 빠짐없이 추출 (시간이 있는 항목 모두)
2. 시간은 24시간 형식 "HH:mm"
3. 날짜는 "YYYY-MM-DD" 형식 — 사용자가 페스티벌 날짜를 알려주면 그걸 사용
4. 종료시간이 없으면 다음 공연 시작시간을 종료시간으로 추론, 마지막은 +60분
5. 컬럼식 레이아웃에서 시간과 아티스트 매칭이 헷갈리면, 텍스트 순서/맥락을 보고 가장 합리적인 매칭 추론
6. 스테이지 헤더가 텍스트에 등장하는 순서와 후속 아티스트들의 순서로 스테이지 추론 (불확실하면 null)
7. 한 컬럼에서 시간이 빠르게 오름차순으로 진행되는 게 정상
8. 반드시 JSON만 응답, 설명 추가 금지

응답 스키마:
{
  "performances": [
    {
      "artistName": "아티스트명",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "stage": "스테이지명 또는 null",
      "date": "YYYY-MM-DD"
    }
  ],
  "notes": "OCR이 컬럼식이어서 일부 매칭이 추정일 수 있음 등 참고 사항"
}`

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OPENAI_API_KEY가 설정되지 않았습니다. .env에 키를 추가해주세요.',
        },
        { status: 500 }
      )
    }

    const { rawText, festivalId } = (await request.json()) as {
      rawText?: string
      festivalId?: string
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { error: 'rawText가 비어있습니다' },
        { status: 400 }
      )
    }

    let festivalContext = ''
    if (festivalId) {
      const festival = await prisma.festival.findUnique({
        where: { id: festivalId },
      })
      if (festival) {
        festivalContext = `\n페스티벌 정보:\n- 이름: ${festival.name}\n- 시작일: ${festival.startDate.toISOString().slice(0, 10)}\n- 종료일: ${festival.endDate.toISOString().slice(0, 10)}\n`
      }
    }

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `다음 OCR 텍스트를 구조화해줘.${festivalContext}\n\n--- OCR 텍스트 ---\n${rawText}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json(
        { error: 'AI 응답이 비어있습니다' },
        { status: 500 }
      )
    }

    let parsed
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
    console.error('OCR refine error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'GPT 재해석 실패', details: message },
      { status: 500 }
    )
  }
}
