<script setup lang="ts">
import { computed } from 'vue'
import type { Plan } from '@/api/plan'
import { getHolidayInfo, isWeekend } from '@/utils/holidays'

interface Props {
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  plans: Plan[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [date: string]
}>()

const handleClick = () => {
  emit('click', props.date)
}

// Calculate completion status
const completedCount = computed(() => {
  return props.plans.filter(p => p.isCompleted).length
})

const totalCount = computed(() => {
  return props.plans.length
})

const allCompleted = computed(() => {
  return totalCount.value > 0 && completedCount.value === totalCount.value
})

// Get plan display text
const getPlanDisplay = (plan: Plan): string => {
  const maxLength = 6
  if (plan.title.length <= maxLength) {
    return plan.title
  }
  return plan.title.slice(0, maxLength) + '...'
}

// Holiday / workday info
const holidayInfo = computed(() => getHolidayInfo(props.date))
const isWeekendDay = computed(() => isWeekend(props.date))
const isWorkDay = computed(() => holidayInfo.value?.type === 'work')
const isHoliday = computed(() => holidayInfo.value?.type === 'holiday')
</script>

<template>
  <div
    class="calendar-day"
    :class="{
      'is-current-month': isCurrentMonth,
      'is-other-month': !isCurrentMonth,
      'is-today': isToday,
      'has-plans': plans.length > 0,
      'all-completed': allCompleted,
      'is-weekend': isWeekendDay && !isWorkDay && !isHoliday,
      'is-holiday': isHoliday,
      'is-workday': isWorkDay,
    }"
    @click="handleClick"
  >
    <div class="day-header">
      <span class="day-number">{{ dayOfMonth }}</span>
      <span v-if="holidayInfo" class="holiday-badge" :class="holidayInfo.type">
        {{ holidayInfo.name }}
      </span>
      <span v-else-if="plans.length > 0" class="plan-badge" :class="{ 'is-complete': allCompleted }">
        {{ completedCount }}/{{ totalCount }}
      </span>
    </div>
    <div class="day-content">
      <div
        v-for="plan in plans.slice(0, 3)"
        :key="plan.id"
        class="plan-item"
        :class="{ 'is-completed': plan.isCompleted }"
        :title="plan.title"
      >
        <span class="plan-dot" :class="{ 'is-completed': plan.isCompleted }"></span>
        {{ getPlanDisplay(plan) }}
      </div>
      <div v-if="plans.length > 3" class="more-plans">
        +{{ plans.length - 3 }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-day {
  min-height: 90px;
  padding: 8px;
  background-color: #fff;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background-color: var(--color-primary-lightest);
}

.is-other-month {
  background-color: var(--color-gray-50);
  color: var(--text-tertiary);
}

.is-today {
  background: linear-gradient(135deg, var(--color-primary-lightest) 0%, #fff 100%);
}

.is-today .day-number {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
}

.has-plans {
  background-color: #fff;
}

.all-completed {
  background-color: #f0fdf4;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.plan-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: var(--color-warning-lightest, #fffbeb);
  color: var(--color-warning);
  border-radius: var(--radius-full);
}

.plan-badge.is-complete {
  background: var(--color-primary-lightest);
  color: var(--color-primary);
}

.holiday-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.holiday-badge.holiday {
  background: #fef2f2;
  color: #ef4444;
}

.holiday-badge.work {
  background: #eff6ff;
  color: #3b82f6;
}

/* Weekend day styling */
.calendar-day.is-weekend .day-number {
  color: #ef4444;
}

/* Holiday day styling */
.calendar-day.is-holiday {
  background-color: #fef2f2;
}

.calendar-day.is-holiday .day-number {
  color: #ef4444;
}

/* Workday (adjusted rest day) styling */
.calendar-day.is-workday {
  background-color: #eff6ff;
}

.calendar-day.is-workday .day-number {
  color: #3b82f6;
}

.day-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.plan-item {
  font-size: 11px;
  padding: 3px 6px;
  background-color: var(--color-primary-lightest);
  color: var(--color-primary-dark);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.plan-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.plan-item.is-completed {
  background-color: var(--color-gray-100);
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.plan-dot.is-completed {
  background: var(--color-gray-300);
}

.more-plans {
  font-size: 10px;
  color: var(--text-tertiary);
  text-align: center;
  padding: 2px;
  font-weight: 600;
}

/* Tablet Responsive */
@media (max-width: 1024px) {
  .calendar-day {
    min-height: 75px;
    padding: 6px;
  }

  .day-number {
    width: 24px;
    height: 24px;
    font-size: 13px;
  }

  .is-today .day-number {
    width: 24px;
    height: 24px;
  }

  .plan-item {
    font-size: 10px;
    padding: 2px 4px;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .calendar-day {
    min-height: 55px;
    padding: 4px;
  }

  .day-number {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }

  .is-today .day-number {
    width: 20px;
    height: 20px;
  }

  .plan-item {
    font-size: 9px;
    padding: 1px 3px;
  }

  .plan-dot {
    width: 4px;
    height: 4px;
  }

  .more-plans {
    font-size: 9px;
  }

  .plan-badge {
    font-size: 9px;
    padding: 1px 4px;
  }
}

@media (max-width: 480px) {
  .calendar-day {
    min-height: 45px;
    padding: 2px;
  }

  .day-number {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }

  .is-today .day-number {
    width: 18px;
    height: 18px;
  }

  .plan-item {
    font-size: 8px;
    padding: 1px 2px;
  }

  .day-header {
    margin-bottom: 2px;
  }
}
</style>
