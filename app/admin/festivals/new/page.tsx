'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface KopisResult {
  id: string
  name: string
  startDate: string
  endDate: string
  location: string
  poster: string
  genre: string
  state: string
}

export default function NewFestivalPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<KopisResult[]>([])
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    location: '',
    genre: '록/메탈',
    imageUrl: '',
    description: '',
    lineup: '',
  })

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력해주세요')
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/admin/kopis/search?keyword=${encodeURIComponent(searchKeyword)}`)
      const data = await res.json()
      
      if (res.ok) {
        setSearchResults(data)
        if (data.length === 0) {
          alert('검색 결과가 없습니다')
        }
      } else {
        alert(data.error || 'KOPIS API 키를 확인해주세요')
      }
    } catch (error) {
      alert('검색 중 오류가 발생했습니다')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result: KopisResult) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/)
      if (!match) return ''
      return `${match[1]}-${match[2]}-${match[3]}`
    }

    setFormData({
      ...formData,
      name: result.name,
      startDate: formatDate(result.startDate),
      endDate: formatDate(result.endDate),
      location: result.location,
      imageUrl: result.poster,
      genre: result.genre.includes('록') ? '록/메탈' : 
             result.genre.includes('힙합') ? '힙합' :
             result.genre.includes('EDM') || result.genre.includes('일렉트로닉') ? 'EDM' :
             result.genre.includes('인디') ? '인디' :
             result.genre.includes('재즈') ? '재즈' :
             result.genre.includes('클래식') ? '클래식' : '록/메탈',
    })
    setSearchResults([])
    setSearchKeyword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('페스티벌이 추가되었습니다!')
        setFormData({
          name: '',
          startDate: '',
          endDate: '',
          location: '',
          genre: '록/메탈',
          imageUrl: '',
          description: '',
          lineup: '',
        })
        setSearchKeyword('')
        setSearchResults([])
        searchInputRef.current?.focus()
      } else {
        const error = await response.json()
        alert(`오류: ${error.error}`)
      }
    } catch (error) {
      alert('추가 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">페스티벌 추가</h1>
      
      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-bold mb-4">🔍 KOPIS에서 검색하기</h2>
        <div className="flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="페스티벌 이름으로 검색 (예: 지산 밸리)"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {searching ? '검색 중...' : '검색'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="flex gap-4">
                  {result.poster && (
                    <img 
                      src={result.poster} 
                      alt={result.name}
                      className="w-16 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold">{result.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.startDate} ~ {result.endDate}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {result.location} | 🎵 {result.genre}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">페스티벌 이름 *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="지산 밸리 록 페스티벌 2025"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">시작 날짜 *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">종료 날짜 *</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">장소 *</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="경기도 이천시 지산포레스트리조트"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">장르 *</label>
          <select
            required
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          >
            <option value="록/메탈">록/메탈</option>
            <option value="팝/록">팝/록</option>
            <option value="록/인디">록/인디</option>
            <option value="힙합">힙합</option>
            <option value="EDM">EDM</option>
            <option value="인디">인디</option>
            <option value="재즈">재즈</option>
            <option value="클래식">클래식</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">포스터 이미지 URL</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            placeholder="https://example.com/poster.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            라인업 (쉼표로 구분)
          </label>
          <textarea
            value={formData.lineup}
            onChange={(e) => setFormData({ ...formData, lineup: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            rows={3}
            placeholder="Foo Fighters, 뱀파이어 위켄드, 너바나, 새소년"
          />
          <p className="text-sm text-gray-500 mt-1">
            예: Foo Fighters, 뱀파이어 위켄드, 너바나
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            rows={3}
            placeholder="대한민국 대표 록 페스티벌"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '추가 중...' : '페스티벌 추가'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
