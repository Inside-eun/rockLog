const STORAGE_KEY = 'watchedPerformances'

export interface WatchedPerformance {
  performanceId: string
  watchedAt: string
  isPartial: boolean
  actualMinutes?: number
  notes?: string
}

export const storage = {
  getWatchedPerformances(): string[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },

  savePerformance(performanceId: string): void {
    const existing = this.getWatchedPerformances()
    if (!existing.includes(performanceId)) {
      existing.push(performanceId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    }
  },

  saveMultiplePerformances(performanceIds: string[]): void {
    const existing = this.getWatchedPerformances()
    const combined = Array.from(new Set([...existing, ...performanceIds]))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined))
  },

  removePerformance(performanceId: string): void {
    const existing = this.getWatchedPerformances()
    const filtered = existing.filter(id => id !== performanceId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  isWatched(performanceId: string): boolean {
    return this.getWatchedPerformances().includes(performanceId)
  },

  getCount(): number {
    return this.getWatchedPerformances().length
  },
}
