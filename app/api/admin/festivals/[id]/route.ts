import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.festival.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting festival:', error)
    return NextResponse.json(
      { error: 'Failed to delete festival' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const { name, startDate, endDate, location, genre, imageUrl, description, lineup } = data

    const lineupArray = lineup ? lineup.split(',').map((item: string) => item.trim()) : []

    const festival = await prisma.festival.update({
      where: { id },
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
    console.error('Error updating festival:', error)
    return NextResponse.json(
      { error: 'Failed to update festival' },
      { status: 500 }
    )
  }
}
