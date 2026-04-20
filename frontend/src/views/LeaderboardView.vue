<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { getLeaderboard, type LeaderboardEntry } from '@/api/plan'
import { ElMessage } from 'element-plus'
import { Trophy, ArrowLeft, Timer, List } from '@element-plus/icons-vue'
import { useFocusStore } from '@/stores/focus'

type Period = 'daily' | 'monthly' | 'yearly'
type LeaderboardType = 'tasks' | 'focus'

interface LeaderboardItem extends LeaderboardEntry {
  sessionCount?: number
  totalDuration?: number
  rank?: number
}

const router = useRouter()
const userStore = useUserStore()
const focusStore = useFocusStore()

const period = ref<Period>('daily')
const leaderboardType = ref<LeaderboardType>('tasks')
const leaderboard = ref<LeaderboardItem[]>([])
const loading = ref(false)

const periodLabels: Record<Period, string> = {
  daily: '今日榜',
  monthly: '本月榜',
  yearly: '本年榜',
}

const fetchLeaderboard = async () => {
  loading.value = true
  try {
    if (leaderboardType.value === 'tasks') {
      const result = await getLeaderboard(period.value)
      if (result.data.success) {
        leaderboard.value = result.data.data.leaderboard
      }
    } else {
      // 专注时长排行榜
      const periodMap: Record<Period, 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'> = {
        daily: 'DAY',
        monthly: 'MONTH',
        yearly: 'YEAR',
      }
      await focusStore.fetchLeaderboard(periodMap[period.value])
      if (focusStore.leaderboard) {
        // 转换为统一的格式
        leaderboard.value = focusStore.leaderboard.rankings.map(r => ({
          userId: r.userId,
          username: r.username,
          totalPlans: r.sessionCount,
          completedPlans: r.sessionCount,
          completionRate: Math.min(100, Math.round((r.totalDuration / 3600) * 10)), // 用时长计算一个展示值
        }))
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取排行榜失败')
  } finally {
    loading.value = false
  }
}

watch([period, leaderboardType], fetchLeaderboard)
onMounted(fetchLeaderboard)

const goBack = () => router.push('/')

const currentUserRank = computed(() => {
  const userId = userStore.user?.id
  if (!userId) return null

  if (leaderboardType.value === 'focus' && focusStore.leaderboard?.currentUser) {
    return focusStore.leaderboard.currentUser.rank
  }

  const index = leaderboard.value.findIndex(entry => entry.userId === userId)
  return index >= 0 ? index + 1 : null
})

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const getRankIcon = (index: number) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return null
}

// Format duration
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

// Get current user stats
const currentUserStats = computed(() => {
  if (leaderboardType.value === 'focus') {
    return focusStore.leaderboard?.currentUser as LeaderboardItem | undefined
  }
  return leaderboard.value.find(e => e.userId === userStore.user?.id)
})
</script>

<template>
  <div class="leaderboard-page">
    <div class="leaderboard-container">
      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft />
          <span>返回</span>
        </button>
        <h1 class="page-title">
          <Trophy />
          任务排行榜
        </h1>
        <div class="spacer"></div>
      </div>

      <!-- Type Tabs -->
      <div class="type-tabs">
        <button
          class="type-tab"
          :class="{ active: leaderboardType === 'tasks' }"
          @click="leaderboardType = 'tasks'"
        >
          <el-icon><List /></el-icon>
          任务完成率
        </button>
        <button
          class="type-tab"
          :class="{ active: leaderboardType === 'focus' }"
          @click="leaderboardType = 'focus'"
        >
          <el-icon><Timer /></el-icon>
          专注时长
        </button>
      </div>

      <!-- Period Tabs -->
      <div class="period-tabs">
        <button
          v-for="(label, key) in periodLabels"
          :key="key"
          class="period-tab"
          :class="{ active: period === key }"
          @click="period = key as Period"
        >
          {{ label }}
        </button>
      </div>

      <!-- My Rank Card -->
      <div v-if="currentUserRank && leaderboard.length > 0" class="my-rank-card">
        <div class="my-rank-info">
          <div class="rank-avatar">
            {{ userStore.user?.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="rank-text">
            <span class="rank-label">我的排名</span>
            <span class="rank-value">第 {{ currentUserRank }} 名</span>
          </div>
        </div>
        <div class="my-rank-stats">
          <template v-if="leaderboardType === 'tasks'">
            <div class="mini-stat">
              <span class="mini-stat-value">
                {{ leaderboard.find(e => e.userId === userStore.user?.id)?.completedPlans || 0 }}
              </span>
              <span class="mini-stat-label">已完成</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">
                {{ leaderboard.find(e => e.userId === userStore.user?.id)?.completionRate || 0 }}%
              </span>
              <span class="mini-stat-label">完成率</span>
            </div>
          </template>
          <template v-else>
            <div class="mini-stat">
              <span class="mini-stat-value">
                {{ formatDuration(currentUserStats?.totalDuration || 0) }}
              </span>
              <span class="mini-stat-label">专注时长</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">
                {{ currentUserStats?.sessionCount || 0 }}
              </span>
              <span class="mini-stat-label">专注次数</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Leaderboard List -->
      <div class="leaderboard-list" v-loading="loading">
        <div
          v-for="(entry, index) in leaderboard"
          :key="entry.userId"
          class="leaderboard-item"
          :class="[getRankClass(index), { 'is-me': entry.userId === userStore.user?.id }]"
        >
          <div class="rank-number">
            <span v-if="getRankIcon(index)" class="rank-icon">{{ getRankIcon(index) }}</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <div class="user-avatar">
            {{ entry.username.charAt(0).toUpperCase() }}
          </div>

          <div class="user-details">
            <span class="username">{{ entry.username }}</span>
            <span class="user-meta">
              <template v-if="leaderboardType === 'tasks'">
                {{ entry.completedPlans }} / {{ entry.totalPlans }} 完成
              </template>
              <template v-else>
                {{ entry.sessionCount || 0 }} 次专注
              </template>
            </span>
          </div>

          <template v-if="leaderboardType === 'tasks'">
            <div class="completion-bar">
              <div
                class="completion-fill"
                :style="{ width: `${entry.completionRate}%` }"
              ></div>
            </div>
            <div class="completion-rate">
              {{ entry.completionRate }}%
            </div>
          </template>
          <template v-else>
            <div class="focus-duration">
              {{ formatDuration(entry.totalDuration || 0) }}
            </div>
          </template>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && leaderboard.length === 0" class="empty-state">
          <div class="empty-icon">🏆</div>
          <p>暂无数据，快去完成任务上榜吧！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #f0fdf4 100%);
  background-attachment: fixed;
}

.leaderboard-container {
  max-width: 700px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.back-btn:hover {
  color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-title svg {
  width: 26px;
  height: 26px;
  color: var(--color-accent-dark);
}

.spacer {
  width: 80px;
}

/* Type Tabs */
.type-tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px;
  border-radius: var(--radius-full);
  margin-bottom: 12px;
  backdrop-filter: blur(10px);
}

.type-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
  text-align: center;
}

.type-tab:hover {
  color: var(--text-primary);
}

.type-tab.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.type-tab .el-icon {
  font-size: 16px;
}

/* Period Tabs */
.period-tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px;
  border-radius: var(--radius-full);
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
}

.period-tab {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--radius-full);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
  text-align: center;
}

.period-tab:hover {
  color: var(--text-primary);
}

.period-tab.active {
  background: white;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* My Rank Card */
.my-rank-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: 20px 24px;
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  margin-bottom: 20px;
}

.my-rank-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.my-rank-card .rank-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.rank-text {
  display: flex;
  flex-direction: column;
}

.rank-label {
  font-size: 13px;
  opacity: 0.9;
}

.rank-value {
  font-size: 22px;
  font-weight: 800;
}

.my-rank-stats {
  display: flex;
  gap: 24px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.mini-stat-value {
  font-size: 20px;
  font-weight: 800;
}

.mini-stat-label {
  font-size: 12px;
  opacity: 0.9;
}

/* Leaderboard List */
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.leaderboard-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.leaderboard-item.is-me {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid var(--color-primary-lighter);
}

.rank-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rank-icon {
  font-size: 22px;
}

.leaderboard-item.rank-1 .rank-number {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-radius: 50%;
}

.leaderboard-item.rank-2 .rank-number {
  background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
  color: #4b5563;
  border-radius: 50%;
}

.leaderboard-item.rank-3 .rank-number {
  background: linear-gradient(135deg, #fef9c3 0%, #fde047 100%);
  color: #713f12;
  border-radius: 50%;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.username {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.completion-bar {
  width: 80px;
  height: 8px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.completion-rate {
  width: 44px;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
}

.focus-duration {
  font-size: 14px;
  font-weight: 600;
  color: #409EFF;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 15px;
}

/* Mobile */
@media (max-width: 768px) {
  .leaderboard-page {
    padding: 16px;
  }

  .page-title {
    font-size: 18px;
  }

  .spacer {
    width: 60px;
  }

  .my-rank-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
    padding: 18px;
  }

  .my-rank-stats {
    width: 100%;
    justify-content: center;
  }

  .mini-stat {
    align-items: center;
  }

  .leaderboard-item {
    gap: 10px;
    padding: 12px 14px;
  }

  .rank-number {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .completion-bar {
    width: 60px;
  }

  .completion-rate {
    width: 38px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .back-btn span {
    display: none;
  }

  .period-tab {
    padding: 8px 10px;
    font-size: 13px;
  }

  .leaderboard-item {
    gap: 8px;
    padding: 10px 12px;
  }

  .user-meta {
    font-size: 11px;
  }

  .completion-bar {
    width: 50px;
  }
}
</style>
