import { NextResponse } from 'next/server'
import { scrapeInterparkFestivals } from '@/lib/scraper'

export async function POST() {
  try {
    console.log('스크래핑 시작...')
    const festivals = await scrapeInterparkFestivals()

    return NextResponse.json({
      success: true,
      count: festivals.length,
      festivals,
    })
  } catch (error) {
    console.error('스크래핑 API 오류:', error)
    return NextResponse.json(
      { error: 'Failed to scrape festivals', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST 요청을 사용하여 스크래핑을 시작하세요',
    endpoints: {
      scrape: 'POST /api/scrape',
    },
  })
}
