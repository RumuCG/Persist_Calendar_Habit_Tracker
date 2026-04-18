import request from './request'

export interface Plan {
  id: number
  title: string
  description?: string
  date: string
  time?: string
  priority?: 'high' | 'medium' | 'low'
  isCompleted: boolean
  isDefault?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePlanData {
  title: string
  description?: string
  date: string
  time?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface UpdatePlanData {
  title?: string
  description?: string
  date?: string
  time?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface GetPlansParams {
  startDate?: string
  endDate?: string
}

// 获取计划列表
export function getPlans(params?: GetPlansParams) {
  return request.get<{
    success: boolean
    data: { plans: Plan[] }
  }>('/plans', { params })
}

// 获取单个计划
export function getPlanById(id: number) {
  return request.get<{
    success: boolean
    data: { plan: Plan }
  }>(`/plans/${id}`)
}

// 创建计划
export function createPlan(data: CreatePlanData) {
  return request.post<{
    success: boolean
    data: { plan: Plan }
    message: string
  }>('/plans', data)
}

// 更新计划
export function updatePlan(id: number, data: UpdatePlanData) {
  return request.put<{
    success: boolean
    data: { plan: Plan }
    message: string
  }>(`/plans/${id}`, data)
}

// 删除计划
export function deletePlan(id: number) {
  return request.delete<{
    success: boolean
    message: string
  }>(`/plans/${id}`)
}

// 切换完成状态
export function toggleComplete(id: number, isCompleted: boolean) {
  return request.patch<{
    success: boolean
    data: { plan: Plan }
    message: string
  }>(`/plans/${id}/complete`, { isCompleted })
}

export interface UserStats {
  totalPlans: number
  completedPlans: number
  completionRate: number
  daily: { date: string; total: number; completed: number }[]
  monthly: { month: string; total: number; completed: number }[]
}

export interface LeaderboardEntry {
  userId: number
  username: string
  totalPlans: number
  completedPlans: number
  completionRate: number
}

// 获取用户统计
export function getUserStats() {
  return request.get<{
    success: boolean
    data: UserStats
  }>('/plans/stats/me')
}

// 获取排行榜
export function getLeaderboard(period: 'daily' | 'monthly' | 'yearly' = 'daily') {
  return request.get<{
    success: boolean
    data: {
      leaderboard: LeaderboardEntry[]
      period: string
    }
  }>('/plans/leaderboard', { params: { period } })
}

export interface DefaultTask {
  id: number
  title: string
  description?: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDefaultTaskData {
  title: string
  description?: string
}

// 获取默认任务列表
export function getDefaultTasks() {
  return request.get<{
    success: boolean
    data: { defaultTasks: DefaultTask[] }
  }>('/plans/default')
}

// 创建默认任务
export function createDefaultTask(data: CreateDefaultTaskData) {
  return request.post<{
    success: boolean
    data: { task: DefaultTask }
    message: string
  }>('/plans/default', data)
}

// 更新默认任务
export function updateDefaultTask(id: number, data: Partial<CreateDefaultTaskData>) {
  return request.put<{
    success: boolean
    data: { task: DefaultTask }
    message: string
  }>(`/plans/default/${id}`, data)
}

// 删除默认任务
export function deleteDefaultTask(id: number) {
  return request.delete<{
    success: boolean
    message: string
  }>(`/plans/default/${id}`)
}
