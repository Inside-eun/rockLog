import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface PerformanceInput {
  artistName: string
  startTime: string
  endTime: string
  stage: string | null
}

export async function POST(request: Request) {
  try {
    const { festivalId, performances } = (await request.json()) as {
      festivalId?: string
      performances?: PerformanceInput[]
    }

    if (!festivalId || !Array.isArray(performances) || performances.length === 0) {
      return NextResponse.json(
        { error: 'festivalId와 performances 배열이 필요합니다' },
        { status: 400 }
      )
    }

    const festival = await prisma.festival.findUnique({
      where: { id: festivalId },
    })
    if (!festival) {
      return NextResponse.json(
        { error: '페스티벌을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const created = await prisma.$transaction(
      performances
        .filter((p) => p.artistName && p.startTime && p.endTime)
        .map((p) => {
          const startTime = new Date(p.startTime)
          const endTime = new Date(p.endTime)
          const durationMinutes = Math.max(
            0,
            Math.round((endTime.getTime() - startTime.getTime()) / 60000)
          )
          return prisma.performance.create({
            data: {
              festivalId,
              artistName: p.artistName.trim(),
              startTime,
              endTime,
              stage: (p.stage ?? 'Main Stage').trim() || 'Main Stage',
              durationMinutes,
            },
          })
        })
    )

    return NextResponse.json({ success: true, count: created.length })
  } catch (error) {
    console.error('bulk-json save error:', error)
    return NextResponse.json(
      { error: '저장 실패', details: String(error) },
      { status: 500 }
    )
  }
}
