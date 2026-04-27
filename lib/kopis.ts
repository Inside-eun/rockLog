import { XMLParser } from 'fast-xml-parser'

const KOPIS_API_KEY = process.env.KOPIS_API_KEY || ''
const KOPIS_BASE_URL = 'http://www.kopis.or.kr/openApi/restful'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

export interface KopisPerformance {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  poster: string
  genre: string
  state: string
}

export async function searchKopisPerformances(keyword: string): Promise<KopisPerformance[]> {
  if (!KOPIS_API_KEY) {
    throw new Error('KOPIS API 키가 설정되지 않았습니다')
  }

  try {
    const url = `${KOPIS_BASE_URL}/pblprfr?service=${KOPIS_API_KEY}&stdate=20240101&eddate=20261231&cpage=1&rows=20&shprfnm=${encodeURIComponent(keyword)}`
    
    const response = await fetch(url)
    const xmlText = await response.text()
    
    const result = parser.parse(xmlText)
    
    if (!result.dbs || !result.dbs.db) {
      return []
    }

    const performances = Array.isArray(result.dbs.db) ? result.dbs.db : [result.dbs.db]
    
    return performances.map((perf: any) => ({
      id: perf.mt20id || '',
      name: perf.prfnm || '',
      startDate: perf.prfpdfrom || '',
      endDate: perf.prfpdto || '',
      location: perf.fcltynm || '',
      poster: perf.poster || '',
      genre: perf.genrenm || '',
      state: perf.prfstate || '',
    }))
  } catch (error) {
    console.error('KOPIS API 오류:', error)
    throw new Error('공연 정보를 가져오는데 실패했습니다')
  }
}

export async function getKopisPerformanceDetail(performanceId: string) {
  if (!KOPIS_API_KEY) {
    throw new Error('KOPIS API 키가 설정되지 않았습니다')
  }

  try {
    const url = `${KOPIS_BASE_URL}/pblprfr/${performanceId}?service=${KOPIS_API_KEY}`
    
    const response = await fetch(url)
    const xmlText = await response.text()
    
    const result = parser.parse(xmlText)
    
    if (!result.dbs || !result.dbs.db) {
      throw new Error('공연 정보를 찾을 수 없습니다')
    }

    const perf = result.dbs.db
    
    return {
      id: perf.mt20id || '',
      name: perf.prfnm || '',
      startDate: perf.prfpdfrom || '',
      endDate: perf.prfpdto || '',
      location: perf.fcltynm || '',
      poster: perf.poster || '',
      genre: perf.genrenm || '',
      state: perf.prfstate || '',
      runtime: perf.prfruntime || '',
      age: perf.prfage || '',
      cast: perf.prfcast || '',
      crew: perf.prfcrew || '',
      introImages: perf.styurls?.styurl || [],
    }
  } catch (error) {
    console.error('KOPIS API 상세 정보 오류:', error)
    throw new Error('공연 상세 정보를 가져오는데 실패했습니다')
  }
}
