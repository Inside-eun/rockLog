'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Festival {
  id: string
  name: string
}

export default function BulkUploadPage() {
  const router = useRouter()
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [selectedFestival, setSelectedFestival] = useState('')
  const [csvText, setCsvText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFestivals()
  }, [])

  const fetchFestivals = async () => {
    const response = await fetch('/api/festivals')
    const data = await response.json()
    setFestivals(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFestival) {
      alert('페스티벌을 선택해주세요')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/performances/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalId: selectedFestival,
          csvData: csvText,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.count}개 공연이 추가되었습니다!`)
        router.push('/admin')
      } else {
        const error = await response.json()
        alert(`오류: ${error.error}`)
      }
    } catch (error) {
      alert('업로드 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const exampleCsv = `artistName,startTime,endTime,stage
Foo Fighters,2025-07-25 20:00,2025-07-25 21:30,Main Stage
뱀파이어 위켄드,2025-07-25 18:00,2025-07-25 19:15,Main Stage
너바나,2025-07-26 21:00,2025-07-26 22:30,Main Stage
새소년,2025-07-26 16:00,2025-07-26 17:00,Valley Stage`

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">CSV 일괄 업로드</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        여러 공연을 CSV 형식으로 한 번에 추가합니다
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">페스티벌 선택 *</label>
          <select
            required
            value={selectedFestival}
            onChange={(e) => setSelectedFestival(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          >
            <option value="">선택하세요</option>
            {festivals.map((festival) => (
              <option key={festival.id} value={festival.id}>
                {festival.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">CSV 데이터 *</label>
          <textarea
            required
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 font-mono text-sm"
            rows={12}
            placeholder="CSV 데이터를 붙여넣으세요"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-bold mb-2">📋 CSV 형식 예시</h3>
          <pre className="text-sm bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto">
{exampleCsv}
          </pre>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            • 첫 줄은 헤더(컬럼명)입니다<br/>
            • 날짜/시간 형식: YYYY-MM-DD HH:MM<br/>
            • 시간은 자동으로 계산됩니다
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
          <button
            type="button"
            onClick={() => setCsvText(exampleCsv)}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            예시 불러오기
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
