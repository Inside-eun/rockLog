'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
}

export default function AddPerformancePage() {
  const router = useRouter()
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    festivalId: '',
    artistName: '',
    performanceDate: '',
    startTime: '',
    endTime: '',
    stage: '',
  })

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
    setLoading(true)

    try {
      const startTime = new Date(`${formData.performanceDate} ${formData.startTime}`)
      const endTime = new Date(`${formData.performanceDate} ${formData.endTime}`)
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      const response = await fetch('/api/admin/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalId: formData.festivalId,
          artistName: formData.artistName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          stage: formData.stage,
          durationMinutes,
        }),
      })

      if (response.ok) {
        alert('공연이 추가되었습니다!')
        router.push('/admin')
      } else {
        const error = await response.json()
        alert(`오류: ${error.error}`)
      }
    } catch (error) {
      alert('추가 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const selectedFestival = festivals.find(f => f.id === formData.festivalId)
  const festivalDates: string[] = []
  
  if (selectedFestival) {
    const start = new Date(selectedFestival.startDate)
    const end = new Date(selectedFestival.endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      festivalDates.push(d.toISOString().split('T')[0])
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">공연 추가</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">페스티벌 선택 *</label>
          <select
            required
            value={formData.festivalId}
            onChange={(e) => setFormData({ ...formData, festivalId: e.target.value, performanceDate: '' })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          >
            <option value="">선택하세요</option>
            {festivals.map((festival) => (
              <option key={festival.id} value={festival.id}>
                {festival.name} ({new Date(festival.startDate).toLocaleDateString('ko-KR')} ~ {new Date(festival.endDate).toLocaleDateString('ko-KR')})
              </option>
            ))}
          </select>
        </div>

        {formData.festivalId && (
          <div>
            <label className="block text-sm font-medium mb-2">공연 날짜 *</label>
            <select
              required
              value={formData.performanceDate}
              onChange={(e) => setFormData({ ...formData, performanceDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            >
              <option value="">날짜를 선택하세요</option>
              {festivalDates.map((date, idx) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('ko-KR', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })} (Day {idx + 1})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">아티스트 이름 *</label>
          <input
            type="text"
            required
            value={formData.artistName}
            onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="Foo Fighters"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">시작 시간 *</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">종료 시간 *</label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">스테이지 *</label>
          <input
            type="text"
            required
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="Main Stage"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '추가 중...' : '공연 추가'}
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
