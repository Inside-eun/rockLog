'use client'

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface GenreData {
  genre: string
  count: number
}

interface MonthlyData {
  month: string
  count: number
}

interface StatsChartProps {
  genreData: GenreData[]
  monthlyData: MonthlyData[]
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1']

export function StatsChart({ genreData, monthlyData }: StatsChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">장르별 관람 분포</h3>
        {genreData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genreData}
                dataKey="count"
                nameKey="genre"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.genre} (${entry.count})`}
              >
                {genreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-12">데이터가 없습니다</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h3 className="text-lg font-bold mb-4">월별 관람 횟수</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-12">데이터가 없습니다</p>
        )}
      </div>
    </div>
  )
}
