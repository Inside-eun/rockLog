'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const ImageEditor = dynamic(() => import('@/components/ImageEditor'), {
  ssr: false,
})

interface Festival {
  id: string
  name: string
  startDate: string
  endDate: string
}

interface ExtractedRow {
  artistName: string
  startTime: string
  endTime: string
  stage: string
  date: string
}

type Engine = 'openai' | 'google'
type ReadingOrder = 'auto' | 'row' | 'column'

interface AnalyzeResponse {
  festivalName?: string | null
  performances?: Array<{
    artistName: string
    startTime: string | null
    endTime: string | null
    stage: string | null
    date: string | null
  }>
  notes?: string | null
  rawText?: string
  unparsedLines?: string[]
  error?: string
  details?: string
}

function combineDateTime(date: string, time: string): string {
  if (!date || !time) return ''
  return `${date}T${time.length === 5 ? time : time.padStart(5, '0')}:00`
}

const ENGINE_INFO: Record<
  Engine,
  { label: string; emoji: string; cost: string; desc: string; endpoint: string }
> = {
  openai: {
    label: 'OpenAI GPT-4o Vision',
    emoji: '🤖',
    cost: '~$0.01/장 (정확도 높음)',
    desc: '이미지를 직접 이해하고 구조화된 JSON으로 변환',
    endpoint: '/api/admin/ocr-analyze',
  },
  google: {
    label: 'Google Cloud Vision',
    emoji: '🔍',
    cost: '월 1,000건 무료 + $300 신규 크레딧',
    desc: 'OCR로 텍스트 추출 후 정규식으로 자동 파싱 (정확도 중간)',
    endpoint: '/api/admin/ocr-vision',
  },
}

export default function OCRPage() {
  const router = useRouter()
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [selectedFestival, setSelectedFestival] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [engine, setEngine] = useState<Engine>('google')
  const [readingOrder, setReadingOrder] = useState<ReadingOrder>('column')
  const [columnCount, setColumnCount] = useState(3)
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<ExtractedRow[]>([])
  const [notes, setNotes] = useState('')
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch('/api/festivals')
      .then((r) => r.json())
      .then(setFestivals)
      .catch(() => {})
  }, [])

  const selectedFest = useMemo(
    () => festivals.find((f) => f.id === selectedFestival),
    [festivals, selectedFestival]
  )

  const defaultDate = selectedDate || selectedFest?.startDate?.slice(0, 10) || ''

  const handleFileChange = (f: File | null) => {
    setFile(f)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreviewUrl(url)
      setImageUrl('')
    } else {
      setPreviewUrl('')
    }
  }

  const handleAnalyze = async () => {
    setError('')
    if (!file && !imageUrl) {
      setError('이미지 파일을 업로드하거나 URL을 입력해주세요')
      return
    }

    setAnalyzing(true)
    setRows([])
    setNotes('')
    setRawText('')

    try {
      const formData = new FormData()
      if (selectedFestival) formData.append('festivalId', selectedFestival)
      if (file) formData.append('image', file)
      else if (imageUrl) formData.append('imageUrl', imageUrl)
      if (engine === 'google') {
        formData.append('readingOrder', readingOrder)
        formData.append('columnCount', String(columnCount))
      }

      const res = await fetch(ENGINE_INFO[engine].endpoint, {
        method: 'POST',
        body: formData,
      })

      const data: AnalyzeResponse = await res.json()

      if (!res.ok) {
        setError(data.error || '분석 실패')
        if (data.details) setError((prev) => `${prev}\n${data.details}`)
        return
      }

      const mapped: ExtractedRow[] = (data.performances || []).map((p) => ({
        artistName: p.artistName || '',
        startTime: p.startTime || '',
        endTime: p.endTime || '',
        stage: p.stage || 'Main Stage',
        date: p.date || defaultDate,
      }))

      setRows(mapped)
      setNotes(data.notes || '')
      setRawText(data.rawText || '')

      if (mapped.length === 0) {
        setError('추출된 공연이 없습니다. 이미지를 확인하거나 다른 엔진을 시도해보세요.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleRefineWithGPT = async () => {
    setError('')
    if (!rawText) {
      setError('먼저 Vision으로 OCR 분석을 실행해주세요')
      return
    }

    setRefining(true)
    try {
      const res = await fetch('/api/admin/ocr-refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          festivalId: selectedFestival || undefined,
        }),
      })

      const data: AnalyzeResponse = await res.json()

      if (!res.ok) {
        setError(data.error || 'GPT 재해석 실패')
        if (data.details) setError((prev) => `${prev}\n${data.details}`)
        return
      }

      const mapped: ExtractedRow[] = (data.performances || []).map((p) => ({
        artistName: p.artistName || '',
        startTime: p.startTime || '',
        endTime: p.endTime || '',
        stage: p.stage || 'Main Stage',
        date: p.date || defaultDate,
      }))

      setRows(mapped)
      setNotes(data.notes || '')

      if (mapped.length === 0) {
        setError('GPT가 공연 정보를 추출하지 못했습니다')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setRefining(false)
    }
  }

  const getFestivalDates = () => {
    if (!selectedFest) return []
    const dates: string[] = []
    const start = new Date(selectedFest.startDate)
    const end = new Date(selectedFest.endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const handleFestivalChange = (festivalId: string) => {
    setSelectedFestival(festivalId)
    setSelectedDate('')
    const fest = festivals.find(f => f.id === festivalId)
    if (fest) {
      setSelectedDate(fest.startDate.slice(0, 10))
    }
  }

  const updateRow = (idx: number, key: keyof ExtractedRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row))
    )
  }

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        artistName: '',
        startTime: '',
        endTime: '',
        stage: 'Main Stage',
        date: defaultDate,
      },
    ])
  }

  const handleSave = async () => {
    setError('')
    if (!selectedFestival) {
      setError('페스티벌을 선택해주세요')
      return
    }
    if (rows.length === 0) {
      setError('저장할 공연이 없습니다')
      return
    }

    const invalid = rows.some(
      (r) => !r.artistName || !r.date || !r.startTime || !r.endTime
    )
    if (invalid) {
      setError('모든 행에 아티스트, 날짜, 시작/종료 시간을 입력해주세요')
      return
    }

    setSaving(true)
    try {
      const performances = rows.map((r) => ({
        artistName: r.artistName,
        startTime: combineDateTime(r.date, r.startTime),
        endTime: combineDateTime(r.date, r.endTime),
        stage: r.stage || 'Main Stage',
      }))

      const res = await fetch('/api/admin/performances/bulk-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalId: selectedFestival,
          performances,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '저장 실패')
        return
      }

      alert(`${data.count}개 공연이 저장되었습니다!`)
      router.push(`/festivals/${selectedFestival}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">AI 타임테이블 스캔</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        타임테이블 이미지를 업로드하면 AI가 공연 정보를 자동 추출합니다
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">AI 엔진 선택</label>
          <div className="grid md:grid-cols-2 gap-3">
            {(Object.keys(ENGINE_INFO) as Engine[]).map((key) => {
              const info = ENGINE_INFO[key]
              const active = engine === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEngine(key)}
                  className={`text-left border-2 rounded-lg p-4 transition-colors ${
                    active
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="font-bold mb-1">
                    {info.emoji} {info.label}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                    {info.cost}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {info.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {engine === 'google' && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">📐 읽기 방향</span>
              <span className="text-xs text-gray-500">
                (표 형태 타임테이블이면 컬럼 우선이 정확함)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'auto', label: '자동', desc: 'Vision이 결정' },
                  { id: 'row', label: '행 우선', desc: '좌→우, 위→아래' },
                  { id: 'column', label: '컬럼 우선', desc: '세로줄 먼저' },
                ] as { id: ReadingOrder; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReadingOrder(opt.id)}
                  className={`text-left border-2 rounded-lg p-2 transition-colors ${
                    readingOrder === opt.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>

            {readingOrder === 'column' && (
              <div>
                <label className="block text-xs font-medium mb-2">
                  스테이지(컬럼) 개수
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setColumnCount(Math.max(1, columnCount - 1))}
                    className="w-8 h-8 rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-lg"
                  >
                    −
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setColumnCount(num)}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                          columnCount === num
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setColumnCount(Math.min(6, columnCount + 1))}
                    className="w-8 h-8 rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-lg"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 타임테이블에 표시된 스테이지(세로 컬럼) 개수에 맞춰 선택하세요
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              페스티벌 선택 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedFestival}
              onChange={(e) => handleFestivalChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            >
              <option value="">선택하세요</option>
              {festivals.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({new Date(f.startDate).toLocaleDateString('ko-KR')} ~ {new Date(f.endDate).toLocaleDateString('ko-KR')})
                </option>
              ))}
            </select>
          </div>

          {selectedFestival && (
            <div>
              <label className="block text-sm font-medium mb-2">
                타임테이블 날짜 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
              >
                {getFestivalDates().map((date, i) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })} (Day {i + 1})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                💡 이 날짜가 모든 공연의 기본 날짜로 설정됩니다
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              이미지 파일 업로드
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              또는 이미지 URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                setFile(null)
                setPreviewUrl(e.target.value)
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="https://example.com/timetable.jpg"
            />
          </div>
        </div>

        {previewUrl && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">미리보기</label>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 font-medium"
              >
                ✏️ 이미지 편집 (크롭/마스킹)
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Timetable preview"
              className="max-h-96 border rounded-lg"
            />
          </div>
        )}

        {editing && previewUrl && (
          <ImageEditor
            imageUrl={previewUrl}
            onSave={(blob) => {
              const editedFile = new File([blob], file?.name || 'edited.png', {
                type: 'image/png',
              })
              handleFileChange(editedFile)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing || (!file && !imageUrl) || !selectedFestival || !selectedDate}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {analyzing
            ? `${ENGINE_INFO[engine].label} 분석 중... (5~30초)`
            : !selectedFestival || !selectedDate
            ? '먼저 페스티벌과 날짜를 선택하세요'
            : `${ENGINE_INFO[engine].emoji} ${ENGINE_INFO[engine].label}로 분석 시작`}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        {notes && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
            <strong>메모:</strong> {notes}
          </div>
        )}

        {rawText && (
          <>
            <details className="border rounded-lg p-3" open>
              <summary className="cursor-pointer font-medium text-sm">
                📝 OCR 추출 원본 텍스트 보기
              </summary>
              <pre className="mt-3 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                {rawText}
              </pre>
            </details>

            {engine === 'google' && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-bold mb-1">
                  ✨ 결과가 부정확한가요? GPT로 재해석
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  컬럼 레이아웃 타임테이블은 정규식 매칭이 어긋나기 쉽습니다.
                  위 OCR 텍스트를 GPT-4o mini가 다시 해석해서 더 정확한 결과를 만들어줍니다.
                  <br />
                  <span className="text-xs text-gray-500">
                    (텍스트만 전송해서 비용 ~$0.001/회, OPENAI_API_KEY 필요)
                  </span>
                </p>
                <button
                  onClick={handleRefineWithGPT}
                  disabled={refining}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {refining ? 'GPT 재해석 중... (5~15초)' : '✨ GPT로 재해석하기'}
                </button>
              </div>
            )}
          </>
        )}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                추출 결과 ({rows.length}개) — 검토 후 저장
              </h2>
              <button
                onClick={addRow}
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                + 행 추가
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border p-2 text-left">아티스트</th>
                    <th className="border p-2 text-left w-40">날짜</th>
                    <th className="border p-2 text-left w-24">시작</th>
                    <th className="border p-2 text-left w-24">종료</th>
                    <th className="border p-2 text-left">스테이지</th>
                    <th className="border p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border p-1">
                        <input
                          value={row.artistName}
                          onChange={(e) =>
                            updateRow(idx, 'artistName', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        />
                      </td>
                      <td className="border p-1">
                        {selectedFest ? (
                          <select
                            value={row.date}
                            onChange={(e) =>
                              updateRow(idx, 'date', e.target.value)
                            }
                            className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          >
                            <option value="">날짜 선택</option>
                            {getFestivalDates().map((date, i) => (
                              <option key={date} value={date}>
                                {new Date(date).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  weekday: 'short',
                                })} (Day {i + 1})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) =>
                              updateRow(idx, 'date', e.target.value)
                            }
                            className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                          />
                        )}
                      </td>
                      <td className="border p-1">
                        <input
                          type="time"
                          value={row.startTime}
                          onChange={(e) =>
                            updateRow(idx, 'startTime', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          type="time"
                          value={row.endTime}
                          onChange={(e) =>
                            updateRow(idx, 'endTime', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        />
                      </td>
                      <td className="border p-1">
                        <input
                          value={row.stage}
                          onChange={(e) =>
                            updateRow(idx, 'stage', e.target.value)
                          }
                          className="w-full px-2 py-1 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        />
                      </td>
                      <td className="border p-1 text-center">
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-red-500 hover:text-red-700 px-2"
                          title="삭제"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : `${rows.length}개 공연 저장`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
