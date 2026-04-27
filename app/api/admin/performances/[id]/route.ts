import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const { artistName, startTime, endTime, stage, durationMinutes } = data

    const performance = await prisma.performance.update({
      where: { id },
      data: {
        artistName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        stage,
        durationMinutes,
      },
    })

    return NextResponse.json(performance)
  } catch (error) {
    console.error('Error updating performance:', error)
    return NextResponse.json(
      { error: 'Failed to update performance' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.performance.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting performance:', error)
    return NextResponse.json(
      { error: 'Failed to delete performance' },
      { status: 500 }
    )
  }
}
