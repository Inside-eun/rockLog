import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { performanceIds } = await request.json()

    if (!performanceIds || performanceIds.length === 0) {
      return NextResponse.json({
        totalMinutes: 0,
        totalHours: 0,
        festivalCount: 0,
        performanceCount: 0,
        artists: [],
        genreDistribution: [],
        monthlyDistribution: [],
      })
    }

    const performances = await prisma.performance.findMany({
      where: {
        id: { in: performanceIds },
      },
      include: {
        festival: true,
      },
    })

    const totalMinutes = performances.reduce((sum, p) => sum + p.durationMinutes, 0)
    const totalHours = Math.floor(totalMinutes / 60)

    const uniqueFestivals = new Set(performances.map(p => p.festivalId))
    const festivalCount = uniqueFestivals.size

    const artistCounts: { [key: string]: number } = {}
    performances.forEach(p => {
      artistCounts[p.artistName] = (artistCounts[p.artistName] || 0) + 1
    })

    const artists = Object.entries(artistCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const genreCounts: { [key: string]: number } = {}
    performances.forEach(p => {
      const genre = p.festival.genre
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })

    const genreDistribution = Object.entries(genreCounts).map(([genre, count]) => ({
      genre,
      count,
    }))

    const monthlyCounts: { [key: string]: number } = {}
    performances.forEach(p => {
      const month = new Date(p.startTime).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
      })
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1
    })

    const monthlyDistribution = Object.entries(monthlyCounts).map(([month, count]) => ({
      month,
      count,
    }))

    return NextResponse.json({
      totalMinutes,
      totalHours,
      festivalCount,
      performanceCount: performances.length,
      artists,
      genreDistribution,
      monthlyDistribution,
    })
  } catch (error) {
    console.error('Error calculating stats:', error)
    return NextResponse.json(
      { error: 'Failed to calculate stats' },
      { status: 500 }
    )
  }
}
