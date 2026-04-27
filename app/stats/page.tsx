'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatsChart } from '@/components/stats-chart'
import { storage } from '@/lib/storage'

interface Artist {
  name: string
  count: number
}

interface Stats {
  totalMinutes: number
  totalHours: number
  festivalCount: number
  performanceCount: number
  artists: Artist[]
  genreDistribution: { genre: string; count: number }[]
  monthlyDistribution: { month: string; count: number }[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const performanceIds = storage.getWatchedPerformances()
      
      const response = await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceIds }),
      })

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">통계 계산 중...</p>
      </div>
    )
  }

  if (!stats || stats.performanceCount === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">통계</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          아직 기록된 공연이 없습니다.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          페스티벌 보러 가기
        </Link>
      </div>
    )
  }

  const hours = stats.totalHours
  const minutes = stats.totalMinutes % 60

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">내 관람 통계</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        지금까지의 공연 관람 기록을 확인하세요
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">총 관람 시간</p>
          <p className="text-3xl font-bold">
            {hours > 0 && `${hours}h `}{minutes}m
          </p>
          <p className="text-sm opacity-75 mt-2">{stats.totalMinutes.toLocaleString()}분</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">본 페스티벌</p>
          <p className="text-3xl font-bold">{stats.festivalCount}</p>
          <p className="text-sm opacity-75 mt-2">개 페스티벌</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">본 공연</p>
          <p className="text-3xl font-bold">{stats.performanceCount}</p>
          <p className="text-sm opacity-75 mt-2">개 공연</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">본 아티스트</p>
          <p className="text-3xl font-bold">{stats.artists.length}</p>
          <p className="text-sm opacity-75 mt-2">팀/명</p>
        </div>
      </div>

      <StatsChart
        genreData={stats.genreDistribution}
        monthlyData={stats.monthlyDistribution}
      />

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">관람한 아티스트</h3>
        {stats.artists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.artists.map((artist, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <span className="font-medium">{artist.name}</span>
                {artist.count > 1 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ×{artist.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">데이터가 없습니다</p>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => {
            if (confirm('모든 관람 기록을 삭제하시겠습니까?')) {
              storage.clearAll()
              fetchStats()
            }
          }}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          모든 기록 삭제
        </button>
      </div>
    </div>
  )
}
