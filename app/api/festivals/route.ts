import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const genre = searchParams.get('genre')
  const search = searchParams.get('search')

  try {
    const festivals = await prisma.festival.findMany({
      where: {
        ...(genre && genre !== 'all' ? { genre } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { location: { contains: search } },
          ]
        } : {}),
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        performances: true,
      },
    })

    return NextResponse.json(festivals)
  } catch (error) {
    console.error('Error fetching festivals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch festivals' },
      { status: 500 }
    )
  }
}
