import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, startDate, endDate, location, genre, imageUrl, description, lineup } = data

    const lineupArray = lineup ? lineup.split(',').map((item: string) => item.trim()) : []

    const festival = await prisma.festival.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        genre,
        imageUrl: imageUrl || null,
        description: description || null,
        lineup: lineupArray.length > 0 ? JSON.stringify(lineupArray) : null,
      },
    })

    return NextResponse.json(festival)
  } catch (error) {
    console.error('Error creating festival:', error)
    return NextResponse.json(
      { error: 'Failed to create festival' },
      { status: 500 }
    )
  }
}
