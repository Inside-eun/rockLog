'use client'

import { useState } from 'react'

interface Performance {
  id: string
  artistName: string
  startTime: string
  endTime: string
  stage: string
  durationMinutes: number
}

interface TimetableProps {
  performances: Performance[]
  onPerformanceSelect: (performanceId: string, selected: boolean) => void
  selectedPerformances: Set<string>
}

export function Timetable({
  performances,
  onPerformanceSelect,
  selectedPerformances,
}: TimetableProps) {
  const [filterStage, setFilterStage] = useState<string>('all')

  const stages = Array.from(new Set(performances.map(p => p.stage)))
  
  const groupByDate = (performances: Performance[]) => {
    const grouped: { [key: string]: Performance[] } = {}
    performances.forEach(p => {
      const date = new Date(p.startTime).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(p)
    })
    return grouped
  }

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredPerformances = filterStage === 'all'
    ? performances
    : performances.filter(p => p.stage === filterStage)

  const groupedPerformances = groupByDate(filteredPerformances)

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStage('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStage === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          전체 스테이지
        </button>
        {stages.map(stage => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStage === stage
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {Object.entries(groupedPerformances).map(([date, perfs]) => (
          <div key={date}>
            <h3 className="text-xl font-bold mb-4 pb-2 border-b">{date}</h3>
            <div className="space-y-3">
              {perfs.map(performance => {
                const isSelected = selectedPerformances.has(performance.id)
                return (
                  <div
                    key={performance.id}
                    onClick={() => onPerformanceSelect(performance.id, !isSelected)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-5 h-5 rounded"
                          />
                          <h4 className="text-lg font-bold">{performance.artistName}</h4>
                        </div>
                        <div className="ml-8 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>
                            ⏰ {formatTime(performance.startTime)} - {formatTime(performance.endTime)}
                            <span className="ml-2 text-gray-500">({performance.durationMinutes}분)</span>
                          </p>
                          <p>🎪 {performance.stage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
