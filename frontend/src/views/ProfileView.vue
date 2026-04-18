<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores'
import { getUserStats, type UserStats } from '@/api/plan'
import { ElMessage } from 'element-plus'
import { Trophy, CircleCheck, List, TrendCharts, Calendar, ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const stats = ref<UserStats | null>(null)
const loading = ref(false)

const fetchStats = async () => {
  loading.value = true
  try {
    const result = await getUserStats()
    if (result.data.success) {
      stats.value = result.data.data
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})

const goBack = () => router.push('/')

// Find best day
const bestDay = computed(() => {
  if (!stats.value) return null
  const days = stats.value.daily.filter(d => d.completed > 0)
  if (days.length === 0) return null
  return days.reduce((max, d) => d.completed > max.completed ? d : max, days[0])
})

// Current streak
const streak = computed(() => {
  if (!stats.value) return 0
  let currentStreak = 0
  const daily = [...stats.value.daily].reverse()
  for (const day of daily) {
    if (day.completed > 0) {
      currentStreak++
    } else {
      break
    }
  }
  return currentStreak
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Header -->
      <div class="profile-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft />
          <span>返回</span>
        </button>
        <h1 class="page-title">
          <Trophy />
          个人中心
        </h1>
        <div class="spacer"></div>
      </div>

      <!-- User Card -->
      <div class="user-card">
        <div class="user-avatar">
          {{ userStore.user?.username?.charAt(0).toUpperCase() }}
        </div>
        <div class="user-info">
          <h2 class="username">{{ userStore.user?.username }}</h2>
          <p class="user-email">{{ userStore.user?.email }}</p>
        </div>
        <div class="streak-badge" v-if="streak > 0">
          <span class="streak-fire">🔥</span>
          <span class="streak-count">{{ streak }}</span>
          <span class="streak-label">连续打卡</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid" v-if="stats">
        <div class="stat-card">
          <div class="stat-icon total">
            <List />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalPlans }}</span>
            <span class="stat-label">总任务</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed">
            <CircleCheck />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.completedPlans }}</span>
            <span class="stat-label">已完成</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon rate">
            <TrendCharts />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.completionRate }}%</span>
            <span class="stat-label">完成率</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon best">
            <Calendar />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ bestDay ? bestDay.completed : 0 }}</span>
            <span class="stat-label">单日最佳</span>
          </div>
        </div>
      </div>

      <!-- Daily Chart -->
      <div class="chart-section" v-if="stats">
        <h3 class="section-title">近 30 天任务完成情况</h3>
        <div class="daily-chart">
          <div
            v-for="day in stats.daily"
            :key="day.date"
            class="daily-bar-wrapper"
            :title="`${day.date}：${day.completed}/${day.total}`"
          >
            <div class="daily-bar-container">
              <div
                class="daily-bar total"
                :style="{ height: `${Math.max(day.total > 0 ? (day.total / Math.max(...stats.daily.map(d => d.total))) * 80 + 10 : 4, 4)}%` }"
              ></div>
              <div
                class="daily-bar completed"
                :style="{ height: `${Math.max(day.completed > 0 ? (day.completed / Math.max(...stats.daily.map(d => d.total))) * 80 + 10 : 4, 4)}%` }"
              ></div>
            </div>
            <span class="daily-label" :class="{ 'is-today': day.date === dayjs().format('YYYY-MM-DD') }">
              {{ dayjs(day.date).format('DD') }}
            </span>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot total"></span>
            <span>总任务</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot completed"></span>
            <span>已完成</span>
          </div>
        </div>
      </div>

      <!-- Monthly Chart -->
      <div class="chart-section" v-if="stats">
        <h3 class="section-title">近 12 个月任务完成情况</h3>
        <div class="monthly-chart">
          <div
            v-for="month in stats.monthly"
            :key="month.month"
            class="monthly-bar-wrapper"
            :title="`${month.month}：${month.completed}/${month.total}`"
          >
            <div class="monthly-bar-container">
              <div
                class="monthly-bar-bg"
                :style="{ height: `${month.total > 0 ? (month.total / Math.max(...stats.monthly.map(m => m.total), 1)) * 100 : 4}%` }"
              ></div>
              <div
                class="monthly-bar-fill"
                :style="{ height: `${month.total > 0 ? (month.completed / Math.max(...stats.monthly.map(m => m.total), 1)) * 100 : 0}%` }"
              ></div>
            </div>
            <span class="monthly-label">
              {{ month.month.slice(5) }}月
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && stats && stats.totalPlans === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>还没有任务数据，快去添加任务吧！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #ffe4e6 100%);
  background-attachment: fixed;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

/* Header */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
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

/* User Card */
.user-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: 20px;
}

.user-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.user-email {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.streak-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: var(--radius-lg);
}

.streak-fire {
  font-size: 24px;
}

.streak-count {
  font-size: 24px;
  font-weight: 800;
  color: #92400e;
}

.streak-label {
  font-size: 12px;
  font-weight: 600;
  color: #b45309;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  padding: 20px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.best {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Chart Sections */
.chart-section {
  background: white;
  padding: 24px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px;
}

/* Daily Chart */
.daily-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 140px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-gray-100);
  overflow-x: auto;
}

.daily-bar-wrapper {
  flex: 1;
  min-width: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.daily-bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1px;
  position: relative;
}

.daily-bar {
  width: 6px;
  border-radius: 3px 3px 0 0;
  transition: all var(--transition-fast);
}

.daily-bar.total {
  background: var(--color-gray-200);
}

.daily-bar.completed {
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  position: absolute;
  bottom: 0;
}

.daily-label {
  font-size: 10px;
  color: var(--text-tertiary);
  font-weight: 600;
}

.daily-label.is-today {
  color: var(--color-primary);
  font-weight: 800;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-dot.total {
  background: var(--color-gray-200);
}

.legend-dot.completed {
  background: var(--color-primary);
}

/* Monthly Chart */
.monthly-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-gray-100);
}

.monthly-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.monthly-bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.monthly-bar-bg {
  width: 24px;
  background: var(--color-gray-100);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: all var(--transition-fast);
}

.monthly-bar-fill {
  position: absolute;
  bottom: 0;
  width: 24px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 4px 4px 0 0;
  min-height: 0;
  transition: all var(--transition-fast);
}

.monthly-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 600;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* Settings Card */
.settings-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-lighter);
}

.setting-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.setting-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.setting-icon.default-tasks {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.setting-content {
  flex: 1;
  min-width: 0;
}

.setting-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.setting-arrow {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.settings-card:hover .setting-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

/* Mobile */
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-title svg {
    width: 22px;
    height: 22px;
  }

  .spacer {
    width: 60px;
  }

  .user-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .stat-value {
    font-size: 20px;
  }

  .chart-section {
    padding: 16px;
  }

  .daily-chart {
    height: 120px;
  }

  .monthly-chart {
    height: 140px;
    gap: 4px;
  }

  .monthly-bar-bg,
  .monthly-bar-fill {
    width: 16px;
  }
}

@media (max-width: 480px) {
  .back-btn span {
    display: none;
  }

  .stats-grid {
    gap: 8px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-icon svg {
    width: 20px;
    height: 20px;
  }

  .daily-bar {
    width: 4px;
  }

  .daily-label {
    font-size: 9px;
  }
}
</style>
