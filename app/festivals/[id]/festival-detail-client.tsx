'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Timetable } from '@/components/timetable'

interface Performance {
  id: string
  artistName: string
  startTime: string
  endTime: string
  stage: string
  durationMinutes: number
}

interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  genre: string
  imageUrl: string | null
  lineup: string | null
  description: string | null
  performances: Performance[]
}

interface FestivalDetailClientProps {
  festival: Festival
}

export function FestivalDetailClient({ festival }: FestivalDetailClientProps) {
  const [selectedPerformances, setSelectedPerformances] = useState<Set<string>>(new Set())
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    loadSavedPerformances()
  }, [festival.id])

  const loadSavedPerformances = () => {
    const saved = localStorage.getItem('watchedPerformances')
    if (saved) {
      const data = JSON.parse(saved)
      const festivalPerformances = data.filter((id: string) => 
        festival.performances.some(p => p.id === id)
      )
      setSelectedPerformances(new Set(festivalPerformances))
      setSavedCount(data.length)
    }
  }

  const handlePerformanceSelect = (performanceId: string, selected: boolean) => {
    const newSelected = new Set(selectedPerformances)
    if (selected) {
      newSelected.add(performanceId)
    } else {
      newSelected.delete(performanceId)
    }
    setSelectedPerformances(newSelected)
  }

  const saveWatchedPerformances = () => {
    const existingSaved = localStorage.getItem('watchedPerformances')
    const existingIds = existingSaved ? JSON.parse(existingSaved) : []
    
    const newIds = Array.from(selectedPerformances)
    const combined = Array.from(new Set([...existingIds, ...newIds]))
    
    localStorage.setItem('watchedPerformances', JSON.stringify(combined))
    setSavedCount(combined.length)
    
    alert(`${selectedPerformances.size}개 공연이 기록되었습니다!`)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const totalMinutes = Array.from(selectedPerformances).reduce((sum, id) => {
    const perf = festival.performances.find(p => p.id === id)
    return sum + (perf?.durationMinutes || 0)
  }, 0)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const lineup = festival.lineup ? JSON.parse(festival.lineup) : []

  return (
    <div>
      <Link href="/" className="inline-flex items-center text-blue-600 hover:underline mb-6">
        ← 목록으로 돌아가기
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            {festival.imageUrl && (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-4">
                <Image
                  src={festival.imageUrl}
                  alt={festival.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h1 className="text-2xl font-bold">{festival.name}</h1>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📅</span>
                  <div>
                    <p className="font-medium">기간</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(festival.startDate)} - {formatDate(festival.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📍</span>
                  <div>
                    <p className="font-medium">장소</p>
                    <p className="text-gray-600 dark:text-gray-400">{festival.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">🎸</span>
                  <div>
                    <p className="font-medium">장르</p>
                    <p className="text-gray-600 dark:text-gray-400">{festival.genre}</p>
                  </div>
                </div>

                {lineup.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">🎤</span>
                    <div>
                      <p className="font-medium">라인업</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {lineup.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {festival.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 pt-4 border-t">
                  {festival.description}
                </p>
              )}
            </div>

            {selectedPerformances.size > 0 && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="font-bold mb-2">선택한 공연</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedPerformances.size}개
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  총 {hours > 0 && `${hours}시간 `}{minutes}분
                </p>
                <button
                  onClick={saveWatchedPerformances}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  관람 기록 저장
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">타임테이블</h2>
          <Timetable
            performances={festival.performances}
            onPerformanceSelect={handlePerformanceSelect}
            selectedPerformances={selectedPerformances}
          />
        </div>
      </div>
    </div>
  )
}
