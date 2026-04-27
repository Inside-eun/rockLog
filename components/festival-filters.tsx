'use client'

interface FestivalFiltersProps {
  selectedGenre: string
  searchQuery: string
  onGenreChange: (genre: string) => void
  onSearchChange: (query: string) => void
}

const GENRES = [
  { value: 'all', label: '전체' },
  { value: '록/메탈', label: '록/메탈' },
  { value: '팝/록', label: '팝/록' },
  { value: '록/인디', label: '록/인디' },
  { value: '힙합', label: '힙합' },
  { value: 'EDM', label: 'EDM' },
  { value: '인디', label: '인디' },
]

export function FestivalFilters({
  selectedGenre,
  searchQuery,
  onGenreChange,
  onSearchChange,
}: FestivalFiltersProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => (
          <button
            key={genre.value}
            onClick={() => onGenreChange(genre.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedGenre === genre.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {genre.label}
          </button>
        ))}
      </div>
      
      <div className="relative">
        <input
          type="text"
          placeholder="페스티벌 이름이나 장소로 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
        />
        <span className="absolute right-4 top-3 text-gray-400">🔍</span>
      </div>
    </div>
  )
}
