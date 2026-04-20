import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as focusApi from '@/api/focus'
import type { FocusSession, FocusStats, FocusLeaderboardResponse } from '@/api/focus'

export type TimerMode = 'COUNTDOWN' | 'STOPWATCH'
export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'

export interface FocusState {
  // 当前专注会话
  currentSession: FocusSession | null
  timerStatus: TimerStatus
  timerMode: TimerMode
  remainingTime: number // 倒计时剩余秒数
  elapsedTime: number // 正计时已用秒数
  expectedDuration: number // 预期专注时长（秒）
  title: string

  // 历史记录
  sessions: FocusSession[]
  totalCount: number
  currentPage: number

  // 统计数据
  stats: FocusStats | null

  // 排行榜
  leaderboard: FocusLeaderboardResponse | null

  // 加载状态
  loading: boolean
  error: string | null
}

export const useFocusStore = defineStore('focus', () => {
  // State
  const currentSession = ref<FocusSession | null>(null)
  const timerStatus = ref<TimerStatus>('IDLE')
  const timerMode = ref<TimerMode>('COUNTDOWN')
  const remainingTime = ref(0)
  const elapsedTime = ref(0)
  const expectedDuration = ref(25 * 60) // 默认25分钟
  const title = ref('')
  const sessions = ref<FocusSession[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const stats = ref<FocusStats | null>(null)
  const leaderboard = ref<FocusLeaderboardResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const formattedRemainingTime = computed(() => {
    const minutes = Math.floor(remainingTime.value / 60)
    const seconds = remainingTime.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const formattedElapsedTime = computed(() => {
    const hours = Math.floor(elapsedTime.value / 3600)
    const minutes = Math.floor((elapsedTime.value % 3600) / 60)
    const seconds = elapsedTime.value % 60
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const progress = computed(() => {
    if (timerMode.value === 'COUNTDOWN' && expectedDuration.value > 0) {
      return ((expectedDuration.value - remainingTime.value) / expectedDuration.value) * 100
    }
    return 0
  })

  const isRunning = computed(() => timerStatus.value === 'RUNNING')
  const isPaused = computed(() => timerStatus.value === 'PAUSED')
  const isIdle = computed(() => timerStatus.value === 'IDLE')

  // Actions
  // 设置专注标题
  function setTitle(value: string) {
    title.value = value
  }

  // 设置计时模式
  function setTimerMode(mode: TimerMode) {
    timerMode.value = mode
  }

  // 设置预期时长
  function setExpectedDuration(seconds: number) {
    expectedDuration.value = seconds
    remainingTime.value = seconds
  }

  // 开始专注
  async function startFocus() {
    loading.value = true
    error.value = null

    try {
      const response = await focusApi.createFocusSession({
        title: title.value,
        mode: timerMode.value,
        expectedDuration: timerMode.value === 'COUNTDOWN' ? expectedDuration.value : undefined,
      })

      if (response.data.success) {
        currentSession.value = response.data.data
        timerStatus.value = 'RUNNING'

        // 初始化计时器
        if (timerMode.value === 'COUNTDOWN') {
          remainingTime.value = expectedDuration.value
        } else {
          elapsedTime.value = 0
        }

        // 保存到本地存储（防止页面刷新）
        saveToLocalStorage()
      }
    } catch (err: any) {
      error.value = err.message || '开始专注失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 结束专注
  async function endFocus(isCompleted: boolean, interruptReason?: string) {
    if (!currentSession.value) return

    loading.value = true
    error.value = null

    try {
      const endTime = new Date().toISOString()
      const duration = timerMode.value === 'COUNTDOWN'
        ? expectedDuration.value - remainingTime.value
        : elapsedTime.value

      const response = await focusApi.updateFocusSession(currentSession.value.id, {
        endTime,
        duration: Math.max(0, duration),
        isCompleted,
        isAbandoned: !isCompleted,
        interruptReason,
      })

      if (response.data.success) {
        timerStatus.value = 'COMPLETED'
        currentSession.value = null
        clearLocalStorage()
      }
    } catch (err: any) {
      error.value = err.message || '结束专注失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 计时器 tick
  function tick() {
    if (timerStatus.value !== 'RUNNING') return

    if (timerMode.value === 'COUNTDOWN') {
      remainingTime.value = Math.max(0, remainingTime.value - 1)
      if (remainingTime.value === 0) {
        timerStatus.value = 'COMPLETED'
        endFocus(true)
      }
    } else {
      elapsedTime.value += 1
      // 正计时最大4小时
      if (elapsedTime.value >= 14400) {
        timerStatus.value = 'COMPLETED'
        endFocus(true)
      }
    }

    saveToLocalStorage()
  }

  // 获取专注历史
  async function fetchSessions(page = 1, limit = 20) {
    loading.value = true
    try {
      const response = await focusApi.getFocusSessions({ page, limit })
      if (response.data.success) {
        sessions.value = response.data.data.items
        totalCount.value = response.data.data.pagination.total
        currentPage.value = page
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 获取统计数据
  async function fetchStats(period: 'WEEK' | 'MONTH' | 'YEAR' | 'ALL' = 'ALL') {
    loading.value = true
    try {
      const response = await focusApi.getFocusStats(period)
      if (response.data.success) {
        stats.value = response.data.data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 获取排行榜
  async function fetchLeaderboard(period: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'WEEK') {
    loading.value = true
    try {
      const response = await focusApi.getFocusLeaderboard({ period, limit: 50 })
      if (response.data.success) {
        leaderboard.value = response.data.data
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 本地存储
  function saveToLocalStorage() {
    const data = {
      currentSession: currentSession.value,
      timerStatus: timerStatus.value,
      timerMode: timerMode.value,
      remainingTime: remainingTime.value,
      elapsedTime: elapsedTime.value,
      expectedDuration: expectedDuration.value,
      title: title.value,
      timestamp: Date.now(),
    }
    localStorage.setItem('focus_session', JSON.stringify(data))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('focus_session')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // 检查是否过期（超过4小时）
        if (Date.now() - data.timestamp < 4 * 60 * 60 * 1000) {
          currentSession.value = data.currentSession
          timerStatus.value = data.timerStatus
          timerMode.value = data.timerMode
          remainingTime.value = data.remainingTime
          elapsedTime.value = data.elapsedTime
          expectedDuration.value = data.expectedDuration
          title.value = data.title
          return true
        }
      } catch {
        // 解析失败，忽略
      }
    }
    return false
  }

  function clearLocalStorage() {
    localStorage.removeItem('focus_session')
  }

  // 恢复会话
  async function restoreSession() {
    if (loadFromLocalStorage() && currentSession.value) {
      // 恢复后重新计算时间
      const elapsed = Math.floor((Date.now() - new Date(currentSession.value.startTime).getTime()) / 1000)

      if (timerMode.value === 'COUNTDOWN') {
        remainingTime.value = Math.max(0, expectedDuration.value - elapsed)
        if (remainingTime.value === 0) {
          await endFocus(true)
        }
      } else {
        elapsedTime.value = Math.min(14400, elapsed)
      }
    }
  }

  // 重置状态
  function reset() {
    currentSession.value = null
    timerStatus.value = 'IDLE'
    remainingTime.value = 0
    elapsedTime.value = 0
    title.value = ''
    clearLocalStorage()
  }

  return {
    // State
    currentSession,
    timerStatus,
    timerMode,
    remainingTime,
    elapsedTime,
    expectedDuration,
    title,
    sessions,
    totalCount,
    currentPage,
    stats,
    leaderboard,
    loading,
    error,

    // Getters
    formattedRemainingTime,
    formattedElapsedTime,
    progress,
    isRunning,
    isPaused,
    isIdle,

    // Actions
    setTitle,
    setTimerMode,
    setExpectedDuration,
    startFocus,
    endFocus,
    tick,
    fetchSessions,
    fetchStats,
    fetchLeaderboard,
    restoreSession,
    reset,
  }
})
