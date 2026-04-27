import { NextResponse } from 'next/server'
import { getKopisPerformanceDetail } from '@/lib/kopis'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const detail = await getKopisPerformanceDetail(id)
    return NextResponse.json(detail)
  } catch (error) {
    console.error('KOPIS 상세 정보 오류:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '상세 정보를 가져오는데 실패했습니다' },
      { status: 500 }
    )
  }
}
