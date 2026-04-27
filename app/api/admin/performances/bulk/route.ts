import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface PerformanceRow {
  artistName: string
  startTime: string
  endTime: string
  stage: string
}

export async function POST(request: Request) {
  try {
    const { festivalId, csvData } = await request.json()

    if (!festivalId || !csvData) {
      return NextResponse.json(
        { error: 'festivalId and csvData are required' },
        { status: 400 }
      )
    }

    // CSV 파싱
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map((h: string) => h.trim())
    
    const performances: PerformanceRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim())
      if (values.length < 4) continue
      
      const row: any = {}
      headers.forEach((header: string, index: number) => {
        row[header] = values[index]
      })
      
      performances.push(row as PerformanceRow)
    }

    // DB에 저장
    const created = await Promise.all(
      performances.map((perf) => {
        const startTime = new Date(perf.startTime)
        const endTime = new Date(perf.endTime)
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

        return prisma.performance.create({
          data: {
            festivalId,
            artistName: perf.artistName,
            startTime,
            endTime,
            stage: perf.stage,
            durationMinutes,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      count: created.length,
      performances: created,
    })
  } catch (error) {
    console.error('Error bulk uploading performances:', error)
    return NextResponse.json(
      { error: 'Failed to upload performances', details: String(error) },
      { status: 500 }
    )
  }
}
