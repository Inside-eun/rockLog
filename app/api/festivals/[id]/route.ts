import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const festival = await prisma.festival.findUnique({
      where: { id },
      include: {
        performances: {
          orderBy: [
            { startTime: 'asc' },
            { stage: 'asc' },
          ],
        },
      },
    })

    if (!festival) {
      return NextResponse.json(
        { error: 'Festival not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(festival)
  } catch (error) {
    console.error('Error fetching festival:', error)
    return NextResponse.json(
      { error: 'Failed to fetch festival' },
      { status: 500 }
    )
  }
}
