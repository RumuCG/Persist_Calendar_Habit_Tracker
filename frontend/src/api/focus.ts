import request from './request'

export interface CreateFocusSessionRequest {
  title?: string
  mode: 'COUNTDOWN' | 'STOPWATCH'
  expectedDuration?: number
}

export interface FocusSession {
  id: number
  userId: number
  title: string
  startTime: string
  endTime?: string
  duration: number
  expectedDuration?: number
  mode: 'COUNTDOWN' | 'STOPWATCH'
  isCompleted: boolean
  isAbandoned: boolean
  interruptReason?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateFocusSessionRequest {
  endTime: string
  duration: number
  isCompleted: boolean
  isAbandoned?: boolean
  interruptReason?: string
}

export interface FocusStats {
  totalDuration: number
  totalSessions: number
  dailyAverage: number
  streakDays: number
  maxStreak: number
  distribution: {
    title: string
    duration: number
    percentage: number
  }[]
  dailyTrend: {
    date: string
    duration: number
  }[]
}

export interface FocusRanking {
  rank: number
  userId: number
  username: string
  totalDuration: number
  sessionCount: number
  isCurrentUser: boolean
}

export interface FocusLeaderboardResponse {
  period: string
  rankings: FocusRanking[]
  currentUser: {
    rank: number
    totalDuration: number
    sessionCount: number
  } | null
}

// 创建专注会话
export function createFocusSession(data: CreateFocusSessionRequest) {
  return request.post('/focus', data)
}

// 更新专注会话（结束专注）
export function updateFocusSession(id: number, data: UpdateFocusSessionRequest) {
  return request.put(`/focus/${id}`, data)
}

// 获取专注历史列表
export function getFocusSessions(params?: { page?: number; limit?: number; mode?: string }) {
  return request.get('/focus', { params })
}

// 获取专注统计数据
export function getFocusStats(period?: 'WEEK' | 'MONTH' | 'YEAR' | 'ALL') {
  return request.get('/focus/stats', { params: { period } })
}

// 获取专注时长排行榜
export function getFocusLeaderboard(params?: { period?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'; limit?: number }) {
  return request.get('/focus/leaderboard', { params })
}
