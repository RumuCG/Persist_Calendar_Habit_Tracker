<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { ArrowLeft, ArrowRight, Calendar } from '@element-plus/icons-vue'

dayjs.locale('zh-cn')

interface Props {
  currentDate: string
  completedCount: number
  totalCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:currentDate': [date: string]
  'open-calendar': []
}>()

const formattedDate = computed(() => {
  return dayjs(props.currentDate).format('M月D日')
})

const weekday = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[dayjs(props.currentDate).day()]
})

const greeting = computed(() => {
  const hour = dayjs().hour()
  if (hour < 6) return '🌙 夜深了'
  if (hour < 9) return '☀️ 早上好'
  if (hour < 12) return '⛅ 上午好'
  if (hour < 14) return '🍜 中午好'
  if (hour < 18) return '☕ 下午好'
  return '🌆 晚上好'
})

const progressPercent = computed(() => {
  if (props.totalCount === 0) return 0
  return Math.round((props.completedCount / props.totalCount) * 100)
})

const progressMessage = computed(() => {
  if (props.totalCount === 0) return '开始添加你的第一个任务吧！'
  if (progressPercent.value === 0) return '加油，完成第一个任务！'
  if (progressPercent.value < 50) return '不错的开始，继续加油！'
  if (progressPercent.value < 100) return '快完成了，坚持住！'
  return '🎉 太棒了！全部完成！'
})

const prevDay = () => {
  const newDate = dayjs(props.currentDate).subtract(1, 'day').format('YYYY-MM-DD')
  emit('update:currentDate', newDate)
}

const nextDay = () => {
  const newDate = dayjs(props.currentDate).add(1, 'day').format('YYYY-MM-DD')
  emit('update:currentDate', newDate)
}

const goToToday = () => {
  emit('update:currentDate', dayjs().format('YYYY-MM-DD'))
}

const isToday = computed(() => {
  return props.currentDate === dayjs().format('YYYY-MM-DD')
})
</script>

<template>
  <header class="daily-header">
    <!-- Top Row: Date Navigation -->
    <div class="header-nav">
      <button class="nav-btn" @click="prevDay" aria-label="前一天">
        <ArrowLeft />
      </button>

      <div class="date-display" @click="goToToday">
        <span class="date-text" :class="{ 'is-today': isToday }">
          {{ formattedDate }}
        </span>
        <span class="weekday">{{ weekday }}</span>
        <span v-if="isToday" class="today-badge">今天</span>
      </div>

      <button class="nav-btn" @click="nextDay" aria-label="后一天">
        <ArrowRight />
      </button>

      <button class="calendar-btn" @click="emit('open-calendar')" aria-label="打开日历">
        <Calendar />
      </button>
    </div>

    <!-- Progress Section -->
    <div class="progress-section">
      <div class="progress-text">
        <span class="greeting">{{ greeting }}</span>
        <span class="progress-message">{{ progressMessage }}</span>
      </div>

      <div class="progress-ring-wrapper">
        <svg class="progress-ring" viewBox="0 0 60 60">
          <!-- Background circle -->
          <circle
            class="progress-ring-bg"
            cx="30"
            cy="30"
            r="26"
          />
          <!-- Progress circle -->
          <circle
            class="progress-ring-fill"
            cx="30"
            cy="30"
            r="26"
            :stroke-dasharray="`${progressPercent * 1.63} 163`"
            :class="{ 'is-complete': progressPercent === 100 }"
          />
        </svg>
        <div class="progress-value">
          <span class="completed">{{ completedCount }}</span>
          <span class="separator">/</span>
          <span class="total">{{ totalCount }}</span>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div
          class="progress-bar-fill"
          :style="{ width: `${progressPercent}%` }"
          :class="{ 'is-complete': progressPercent === 100 }"
        />
      </div>
      <span class="progress-percent">{{ progressPercent }}%</span>
    </div>
  </header>
</template>

<style scoped>
.daily-header {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  padding: 24px 20px;
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  color: white;
  box-shadow: 0 10px 40px -10px rgba(236, 72, 153, 0.4);
}

/* Navigation Row */
.header-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.nav-btn,
.calendar-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  transition: all var(--transition-fast);
}

.nav-btn:hover,
.calendar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.nav-btn:active,
.calendar-btn:active {
  transform: scale(0.95);
}

.nav-btn svg,
.calendar-btn svg {
  width: 24px;
  height: 24px;
}

.calendar-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
}

/* Date Display */
.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.date-display:hover {
  background: rgba(255, 255, 255, 0.2);
}

.date-text {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
}

.date-text.is-today {
  color: #fbbf24;
}

.weekday {
  font-size: 14px;
  opacity: 0.9;
}

.today-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  background: #fbbf24;
  color: #92400e;
  border-radius: var(--radius-full);
}

/* Progress Section */
.progress-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.progress-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.greeting {
  font-size: 14px;
  opacity: 0.9;
}

.progress-message {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

/* Progress Ring */
.progress-ring-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 6;
}

.progress-ring-fill {
  fill: none;
  stroke: #fbbf24;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dasharray var(--transition-spring);
}

.progress-ring-fill.is-complete {
  stroke: #fbbf24;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
}

.progress-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: baseline;
  gap: 1px;
  font-weight: 800;
}

.progress-value .completed {
  font-size: 22px;
  color: white;
}

.progress-value .separator {
  font-size: 14px;
  opacity: 0.7;
}

.progress-value .total {
  font-size: 14px;
  opacity: 0.7;
}

/* Progress Bar */
.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: var(--radius-full);
  transition: width var(--transition-spring);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.progress-bar-fill.is-complete {
  background: linear-gradient(90deg, #fbbf24 0%, #fcd34d 50%, #fbbf24 100%);
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}

.progress-percent {
  font-size: 14px;
  font-weight: 700;
  min-width: 40px;
  text-align: right;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .daily-header {
    padding: 20px 16px;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }

  .header-nav {
    margin-bottom: 20px;
  }

  .date-text {
    font-size: 20px;
  }

  .weekday {
    font-size: 13px;
  }

  .progress-message {
    font-size: 16px;
  }

  .progress-ring-wrapper {
    width: 60px;
    height: 60px;
  }

  .progress-value .completed {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .daily-header {
    padding: 16px 12px;
  }

  .nav-btn,
  .calendar-btn {
    width: 36px;
    height: 36px;
  }

  .nav-btn svg,
  .calendar-btn svg {
    width: 20px;
    height: 20px;
  }

  .date-display {
    padding: 6px 12px;
  }

  .date-text {
    font-size: 18px;
  }

  .today-badge {
    font-size: 10px;
    padding: 1px 8px;
  }

  .progress-message {
    font-size: 14px;
  }

  .greeting {
    font-size: 12px;
  }
}
</style>
