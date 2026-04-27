import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ids array' },
        { status: 400 }
      )
    }

    await prisma.performance.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: ids.length 
    })
  } catch (error) {
    console.error('Error deleting performances:', error)
    return NextResponse.json(
      { error: 'Failed to delete performances' },
      { status: 500 }
    )
  }
}
