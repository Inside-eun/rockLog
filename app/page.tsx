import { FestivalsClient } from './festivals-client'

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">페스티벌 목록</h1>
        <p className="text-gray-600 dark:text-gray-400">
          관람한 공연을 기록하고 통계를 확인하세요
        </p>
      </div>
      <FestivalsClient />
    </div>
  )
}
