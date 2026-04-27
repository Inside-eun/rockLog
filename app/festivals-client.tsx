'use client'

import { useState, useEffect } from 'react'
import { FestivalCard } from '@/components/festival-card'
import { FestivalFilters } from '@/components/festival-filters'

interface Performance {
  id: string
  artistName: string
}

interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  genre: string
  imageUrl: string | null
  performances: Performance[]
}

export function FestivalsClient() {
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFestivals()
  }, [selectedGenre, searchQuery])

  const fetchFestivals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedGenre !== 'all') params.append('genre', selectedGenre)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/festivals?${params.toString()}`)
      const data = await response.json()
      setFestivals(data)
    } catch (error) {
      console.error('Failed to fetch festivals:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <FestivalFilters
        selectedGenre={selectedGenre}
        searchQuery={searchQuery}
        onGenreChange={setSelectedGenre}
        onSearchChange={setSearchQuery}
      />

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      ) : festivals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            검색 결과가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {festivals.map((festival) => (
            <FestivalCard
              key={festival.id}
              id={festival.id}
              name={festival.name}
              startDate={festival.startDate}
              endDate={festival.endDate}
              location={festival.location}
              genre={festival.genre}
              imageUrl={festival.imageUrl || undefined}
              performanceCount={festival.performances.length}
            />
          ))}
        </div>
      )}
    </div>
  )
}
