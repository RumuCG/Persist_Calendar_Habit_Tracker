<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import CalendarDay from './CalendarDay.vue'
import type { Plan } from '@/api/plan'

dayjs.locale('zh-cn')

interface Props {
  plans: Plan[]
  currentDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentDate: () => dayjs().format('YYYY-MM-DD'),
})

const emit = defineEmits<{
  'update:currentDate': [date: string]
  'date-click': [date: string]
}>()

// Current displayed month
const currentMonth = ref(dayjs(props.currentDate).startOf('month'))

// Watch external date changes
watch(() => props.currentDate, (newDate) => {
  currentMonth.value = dayjs(newDate).startOf('month')
})

// Weekday headers
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// Calculate calendar data
const calendarDays = computed(() => {
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const startDayOfWeek = startOfMonth.day()

  const days: Array<{
    date: string
    dayOfMonth: number
    isCurrentMonth: boolean
    isToday: boolean
    plans: Plan[]
  }> = []

  // Previous month filler days
  const prevMonthDays = startDayOfWeek
  const prevMonth = startOfMonth.subtract(1, 'month')
  const prevMonthEndDay = prevMonth.endOf('month').date()

  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthEndDay - i
    const date = prevMonth.date(day).format('YYYY-MM-DD')
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: date === dayjs().format('YYYY-MM-DD'),
      plans: getPlansByDate(date),
    })
  }

  // Current month days
  const daysInMonth = endOfMonth.date()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = currentMonth.value.date(day).format('YYYY-MM-DD')
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: date === dayjs().format('YYYY-MM-DD'),
      plans: getPlansByDate(date),
    })
  }

  // Next month filler days (complete 6 rows)
  const remainingCells = 42 - days.length
  const nextMonth = startOfMonth.add(1, 'month')
  for (let day = 1; day <= remainingCells; day++) {
    const date = nextMonth.date(day).format('YYYY-MM-DD')
    days.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: date === dayjs().format('YYYY-MM-DD'),
      plans: getPlansByDate(date),
    })
  }

  return days
})

// Get plans by date
function getPlansByDate(date: string): Plan[] {
  return props.plans.filter(plan => plan.date === date)
}

// Previous month
const prevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
  emit('update:currentDate', currentMonth.value.format('YYYY-MM-DD'))
}

// Next month
const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
  emit('update:currentDate', currentMonth.value.format('YYYY-MM-DD'))
}

// Go to today
const goToToday = () => {
  currentMonth.value = dayjs().startOf('month')
  emit('update:currentDate', dayjs().format('YYYY-MM-DD'))
}

// Date click
const handleDateClick = (date: string) => {
  emit('date-click', date)
}

// Current month display text
const monthDisplay = computed(() => {
  return currentMonth.value.format('YYYY年M月')
})
</script>

<template>
  <div class="calendar-view">
    <!-- Calendar Header -->
    <div class="calendar-header">
      <div class="month-navigation">
        <button class="nav-btn" @click="prevMonth" aria-label="上个月">
          <ArrowLeft />
        </button>
        <h2 class="month-title">{{ monthDisplay }}</h2>
        <button class="nav-btn" @click="nextMonth" aria-label="下个月">
          <ArrowRight />
        </button>
      </div>
      <button class="today-btn" @click="goToToday">今天</button>
    </div>

    <!-- Weekday Headers -->
    <div class="week-header">
      <div
        v-for="day in weekDays"
        :key="day"
        class="week-day"
        :class="{ 'is-weekend': day === '日' || day === '六' }"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <CalendarDay
        v-for="dayInfo in calendarDays"
        :key="dayInfo.date"
        :date="dayInfo.date"
        :day-of-month="dayInfo.dayOfMonth"
        :is-current-month="dayInfo.isCurrentMonth"
        :is-today="dayInfo.isToday"
        :plans="dayInfo.plans"
        @click="handleDateClick"
      />
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  background-color: #fff;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-gray-100);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.nav-btn:hover {
  background: var(--color-primary-lighter);
  color: var(--color-primary);
}

.nav-btn svg {
  width: 18px;
  height: 18px;
}

.month-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  min-width: 140px;
  text-align: center;
}

.today-btn {
  padding: 8px 16px;
  background: var(--color-primary-lightest);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-primary-lighter);
  transition: all var(--transition-fast);
}

.today-btn:hover {
  background: var(--color-primary-lighter);
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
  background: var(--color-gray-100);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  overflow: hidden;
}

.week-day {
  padding: 12px 8px;
  text-align: center;
  font-weight: 700;
  color: var(--text-primary);
  background-color: var(--color-gray-50);
  font-size: 14px;
}

.week-day.is-weekend {
  color: var(--color-danger);
  background-color: #fef2f2;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: var(--color-gray-200);
  border: 1px solid var(--color-gray-200);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
}

/* Tablet Responsive */
@media (max-width: 1024px) {
  .calendar-view {
    padding: 16px;
  }

  .month-title {
    font-size: 20px;
  }

  .week-day {
    padding: 10px 6px;
    font-size: 13px;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .calendar-view {
    padding: 12px;
    border-radius: var(--radius-md);
  }

  .calendar-header {
    margin-bottom: 16px;
  }

  .month-navigation {
    gap: 12px;
  }

  .month-title {
    font-size: 18px;
    min-width: 120px;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .nav-btn svg {
    width: 16px;
    height: 16px;
  }

  .today-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .week-day {
    padding: 8px 4px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .calendar-view {
    padding: 8px;
  }

  .month-title {
    font-size: 16px;
    min-width: 100px;
  }

  .week-day {
    padding: 6px 2px;
    font-size: 11px;
  }
}
</style>
