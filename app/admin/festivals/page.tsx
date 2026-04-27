'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  genre: string
  imageUrl: string | null
  description: string | null
  lineup: string | null
}

export default function FestivalManagePage() {
  const router = useRouter()
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFestivals()
  }, [])

  const fetchFestivals = async () => {
    try {
      const res = await fetch('/api/festivals')
      const data = await res.json()
      setFestivals(data)
    } catch (error) {
      alert('페스티벌 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 페스티벌을 삭제하시겠습니까?\n관련된 모든 공연 데이터도 함께 삭제됩니다.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/festivals/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        alert('페스티벌이 삭제되었습니다')
        fetchFestivals()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">페스티벌 관리</h1>
        <Link
          href="/admin/festivals/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          + 페스티벌 추가
        </Link>
      </div>

      {festivals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          등록된 페스티벌이 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {festivals.map((festival) => (
            <div
              key={festival.id}
              className="border rounded-lg p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{festival.name}</h2>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>📅 {formatDate(festival.startDate)} ~ {formatDate(festival.endDate)}</p>
                    <p>📍 {festival.location}</p>
                    <p>🎵 {festival.genre}</p>
                    {festival.description && (
                      <p className="mt-2">{festival.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/festivals/edit/${festival.id}`}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    수정
                  </Link>
                  <button
                    onClick={() => handleDelete(festival.id, festival.name)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
