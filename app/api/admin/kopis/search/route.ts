import { NextResponse } from 'next/server'
import { searchKopisPerformances } from '@/lib/kopis'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')

    if (!keyword) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요' },
        { status: 400 }
      )
    }

    const results = await searchKopisPerformances(keyword)
    return NextResponse.json(results)
  } catch (error) {
    console.error('KOPIS 검색 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
