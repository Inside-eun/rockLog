import Image from 'next/image'
import Link from 'next/link'

interface FestivalCardProps {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  genre: string
  imageUrl?: string
  performanceCount?: number
}

export function FestivalCard({
  id,
  name,
  startDate,
  endDate,
  location,
  genre,
  imageUrl,
  performanceCount = 0,
}: FestivalCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    })
  }

  const start = formatDate(startDate)
  const end = formatDate(endDate)

  return (
    <Link href={`/festivals/${id}`}>
      <div className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800">
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="inline-block px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
            {genre}
          </div>
          <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            📅 {start} - {end}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            📍 {location}
          </p>
          {performanceCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              🎤 {performanceCount}개 공연
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
