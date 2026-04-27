import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">관리자 페이지</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        페스티벌과 공연 데이터를 관리합니다
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/festivals/new">
          <div className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-bold mb-2">🎪 페스티벌 추가</h2>
            <p className="text-gray-600 dark:text-gray-400">
              새로운 페스티벌을 등록합니다
            </p>
          </div>
        </Link>

        <Link href="/admin/festivals">
          <div className="border rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-bold mb-2">📋 페스티벌 목록 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">
              등록된 페스티벌을 수정하거나 삭제합니다
            </p>
          </div>
        </Link>

        <Link href="/admin/performances">
          <div className="border rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-bold mb-2">🎵 공연 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">
              등록된 공연을 수정하거나 삭제합니다
            </p>
          </div>
        </Link>

        <Link href="/admin/performances/add">
          <div className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-bold mb-2">🎤 공연 추가</h2>
            <p className="text-gray-600 dark:text-gray-400">
              개별 공연을 추가합니다
            </p>
          </div>
        </Link>

        <Link href="/admin/performances/bulk-upload">
          <div className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
            <h2 className="text-xl font-bold mb-2">📊 CSV 일괄 업로드</h2>
            <p className="text-gray-600 dark:text-gray-400">
              여러 공연을 CSV로 한 번에 업로드합니다
            </p>
          </div>
        </Link>

        <Link href="/admin/performances/ocr">
          <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer bg-purple-50/50 dark:bg-purple-900/10">
            <h2 className="text-xl font-bold mb-2">
              ✨ AI 타임테이블 스캔
              <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded">NEW</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              이미지를 업로드하면 GPT-4o가 자동으로 타임테이블을 추출합니다
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12 border rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20">
        <h3 className="font-bold mb-2">💡 타임테이블 수집 팁</h3>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li>• 페스티벌 공식 인스타그램에서 타임테이블 이미지 찾기</li>
          <li>• 수동 입력 또는 CSV 업로드 사용</li>
          <li>• OCR은 보조 도구로만 사용 (검토 필수)</li>
          <li>• 2026년 4월 이전 페스티벌부터 수집</li>
        </ul>
      </div>
    </div>
  )
}
