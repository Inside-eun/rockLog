import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { festivalId, artistName, startTime, endTime, stage, durationMinutes } = data

    const performance = await prisma.performance.create({
      data: {
        festivalId,
        artistName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        stage,
        durationMinutes,
      },
    })

    return NextResponse.json(performance)
  } catch (error) {
    console.error('Error creating performance:', error)
    return NextResponse.json(
      { error: 'Failed to create performance' },
      { status: 500 }
    )
  }
}
