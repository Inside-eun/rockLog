'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditFestivalPage() {
  const router = useRouter()
  const params = useParams()
  const festivalId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    genre: '록/메탈',
    imageUrl: '',
    description: '',
    lineup: '',
  })

  useEffect(() => {
    fetchFestival()
  }, [])

  const fetchFestival = async () => {
    try {
      const res = await fetch(`/api/festivals/${festivalId}`)
      if (res.ok) {
        const festival = await res.json()
        
        const lineupString = festival.lineup 
          ? (typeof festival.lineup === 'string' 
              ? JSON.parse(festival.lineup).join(', ')
              : festival.lineup.join(', '))
          : ''

        setFormData({
          name: festival.name,
          startDate: new Date(festival.startDate).toISOString().split('T')[0],
          endDate: new Date(festival.endDate).toISOString().split('T')[0],
          location: festival.location,
          genre: festival.genre,
          imageUrl: festival.imageUrl || '',
          description: festival.description || '',
          lineup: lineupString,
        })
      } else {
        alert('페스티벌을 찾을 수 없습니다')
        router.push('/admin/festivals')
      }
    } catch (error) {
      alert('페스티벌 정보를 불러오는데 실패했습니다')
      router.push('/admin/festivals')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/festivals/${festivalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('페스티벌이 수정되었습니다!')
        router.push('/admin/festivals')
      } else {
        const error = await response.json()
        alert(`오류: ${error.error}`)
      }
    } catch (error) {
      alert('수정 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="text-center py-12">로딩 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">페스티벌 수정</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">페스티벌 이름 *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="지산 밸리 록 페스티벌 2025"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">시작 날짜 *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">종료 날짜 *</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">장소 *</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="경기도 이천시 지산포레스트리조트"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">장르 *</label>
          <select
            required
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          >
            <option value="록/메탈">록/메탈</option>
            <option value="팝/록">팝/록</option>
            <option value="록/인디">록/인디</option>
            <option value="힙합">힙합</option>
            <option value="EDM">EDM</option>
            <option value="인디">인디</option>
            <option value="재즈">재즈</option>
            <option value="클래식">클래식</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">포스터 이미지 URL</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="https://example.com/poster.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            라인업 (쉼표로 구분)
          </label>
          <textarea
            value={formData.lineup}
            onChange={(e) => setFormData({ ...formData, lineup: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            rows={3}
            placeholder="Foo Fighters, 뱀파이어 위켄드, 너바나, 새소년"
          />
          <p className="text-sm text-gray-500 mt-1">
            예: Foo Fighters, 뱀파이어 위켄드, 너바나
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            rows={3}
            placeholder="대한민국 대표 록 페스티벌"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '수정 중...' : '페스티벌 수정'}
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
