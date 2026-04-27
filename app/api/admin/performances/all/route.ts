import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const performances = await prisma.performance.findMany({
      include: {
        festival: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [
        { startTime: 'desc' },
      ],
    })

    return NextResponse.json(performances)
  } catch (error) {
    console.error('Error fetching performances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    )
  }
}
