'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Performance {
  id: string
  artistName: string
  startTime: string
  endTime: string
  stage: string
  durationMinutes: number
  festival: {
    id: string
    name: string
    startDate: string
    endDate: string
  }
}

export default function PerformancesListPage() {
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editForm, setEditForm] = useState({
    artistName: '',
    performanceDate: '',
    startTime: '',
    endTime: '',
    stage: '',
  })

  useEffect(() => {
    fetchPerformances()
  }, [])

  const fetchPerformances = async () => {
    try {
      const response = await fetch('/api/admin/performances/all')
      const data = await response.json()
      setPerformances(data)
    } catch (error) {
      alert('공연 목록을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (performance: Performance) => {
    setEditingId(performance.id)
    const startDate = new Date(performance.startTime)
    setEditForm({
      artistName: performance.artistName,
      performanceDate: startDate.toISOString().slice(0, 10),
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: new Date(performance.endTime).toTimeString().slice(0, 5),
      stage: performance.stage,
    })
  }

  const handleSave = async (id: string) => {
    try {
      const startTime = new Date(`${editForm.performanceDate}T${editForm.startTime}:00`)
      const endTime = new Date(`${editForm.performanceDate}T${editForm.endTime}:00`)
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

      const response = await fetch(`/api/admin/performances/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: editForm.artistName,
          stage: editForm.stage,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
        }),
      })

      if (response.ok) {
        setEditingId(null)
        fetchPerformances()
      } else {
        alert('수정 실패')
      }
    } catch (error) {
      alert('수정 중 오류 발생')
    }
  }

  const handleDelete = async (id: string, artistName: string) => {
    if (!confirm(`"${artistName}" 공연을 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/admin/performances/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPerformances()
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      alert('삭제 중 오류 발생')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 공연을 선택해주세요')
      return
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 공연을 삭제하시겠습니까?`)) return

    try {
      const response = await fetch('/api/admin/performances/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      if (response.ok) {
        setSelectedIds(new Set())
        fetchPerformances()
      } else {
        alert('삭제 실패')
      }
    } catch (error) {
      alert('삭제 중 오류 발생')
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === performances.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(performances.map(p => p.id)))
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">공연 관리</h1>
        <div className="flex gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              선택 삭제 ({selectedIds.size})
            </button>
          )}
          <Link
            href="/admin/performances/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            공연 추가
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === performances.length && performances.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">페스티벌</th>
              <th className="px-4 py-3 text-left text-sm font-medium">아티스트</th>
              <th className="px-4 py-3 text-left text-sm font-medium">날짜</th>
              <th className="px-4 py-3 text-left text-sm font-medium">시작</th>
              <th className="px-4 py-3 text-left text-sm font-medium">종료</th>
              <th className="px-4 py-3 text-left text-sm font-medium">스테이지</th>
              <th className="px-4 py-3 text-left text-sm font-medium">시간</th>
              <th className="px-4 py-3 text-left text-sm font-medium">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {performances.map((perf) => (
              <tr key={perf.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {editingId === perf.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(perf.id)}
                        onChange={() => toggleSelect(perf.id)}
                        className="w-4 h-4 cursor-pointer"
                        disabled
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{perf.festival.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.artistName}
                        onChange={(e) => setEditForm({ ...editForm, artistName: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={editForm.performanceDate}
                        onChange={(e) => setEditForm({ ...editForm, performanceDate: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700"
                        min={perf.festival.startDate.slice(0, 10)}
                        max={perf.festival.endDate.slice(0, 10)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.stage}
                        onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{perf.durationMinutes}분</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(perf.id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(perf.id)}
                        onChange={() => toggleSelect(perf.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{perf.festival.name}</td>
                    <td className="px-4 py-3 text-sm font-medium">{perf.artistName}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(perf.startTime).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(perf.startTime).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(perf.endTime).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">{perf.stage}</td>
                    <td className="px-4 py-3 text-sm">{perf.durationMinutes}분</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(perf)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(perf.id, perf.artistName)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {performances.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          등록된 공연이 없습니다
        </div>
      )}
    </div>
  )
}
