<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { Plus, Trophy, Calendar as CalendarIcon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import DailyHeader from '@/components/DailyHeader.vue'
import TaskItem from '@/components/TaskItem.vue'
import PlanModal from '@/components/PlanModal.vue'
import CalendarView from '@/components/CalendarView.vue'
import {
  getPlans, toggleComplete, deletePlan, createPlan,
  getDefaultTasks, type Plan, type DefaultTask
} from '@/api/plan'

// Current date
const currentDate = ref(dayjs().format('YYYY-MM-DD'))

// Plans data
const plans = ref<Plan[]>([])
const defaultTasks = ref<DefaultTask[]>([])
const loading = ref(false)

// Modal control
const modalVisible = ref(false)
const selectedPlan = ref<Plan | null>(null)

// Calendar drawer
const showCalendar = ref(false)

// Get hidden default tasks for current date from localStorage
const getHiddenDefaults = (date: string): number[] => {
  try {
    const raw = localStorage.getItem(`hidden_defaults_${date}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const setHiddenDefaults = (date: string, ids: number[]) => {
  localStorage.setItem(`hidden_defaults_${date}`, JSON.stringify(ids))
}

// Check if a default task has been added as a regular plan for current date
const isDefaultAdded = (task: DefaultTask): boolean => {
  return plans.value.some(
    plan => plan.date === currentDate.value && plan.title === task.title
  )
}

// Find the regular plan created from a default task
const findAddedPlan = (task: DefaultTask): Plan | undefined => {
  return plans.value.find(
    plan => plan.date === currentDate.value && plan.title === task.title
  )
}

// Build display items for current date
const dailyItems = computed(() => {
  const hidden = getHiddenDefaults(currentDate.value)

  // Regular plans for current date
  const regularPlans = plans.value
    .filter(plan => plan.date === currentDate.value)
    .map(plan => ({
      ...plan,
      isDefaultSource: defaultTasks.value.some(dt => dt.title === plan.title),
    }))

  // Default tasks that are not added and not hidden
  const unaddedDefaults = defaultTasks.value
    .filter(task => !isDefaultAdded(task) && !hidden.includes(task.id))
    .map(task => ({
      id: -task.id, // negative id to distinguish from regular plans
      title: task.title,
      description: task.description,
      date: currentDate.value,
      isCompleted: false,
      isDefault: true,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    } as Plan))

  const all = [...regularPlans, ...unaddedDefaults]

  return all.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    if (a.time && b.time) {
      return a.time.localeCompare(b.time)
    }
    return 0
  })
})

// For backward compatibility with template refs
const dailyPlans = computed(() => dailyItems.value)

const completedCount = computed(() => {
  return dailyPlans.value.filter(p => p.isCompleted).length
})

const totalCount = computed(() => dailyPlans.value.length)

// Month plans for calendar
const currentMonth = computed(() => dayjs(currentDate.value).format('YYYY-MM'))

const monthPlans = computed(() => {
  return plans.value.filter(plan => {
    return plan.date.startsWith(currentMonth.value)
  })
})

// Check if all tasks completed
const allCompleted = computed(() => {
  return totalCount.value > 0 && completedCount.value === totalCount.value
})

// Show celebration with delay to wait for last task animation
const showCelebration = ref(false)

// Calculate animation delay for the last task (50ms per item, max 5 items visible)
const lastTaskAnimationDelay = computed(() => {
  const maxVisibleItems = Math.min(totalCount.value, 5)
  return maxVisibleItems * 50 + 300 // stagger delay + base animation duration
})

// Watch for all completed status and show celebration with delay
watch(allCompleted, (completed) => {
  if (completed) {
    // Wait for last task to finish its slide-up animation
    setTimeout(() => {
      showCelebration.value = true
    }, lastTaskAnimationDelay.value)
  } else {
    showCelebration.value = false
  }
})

// Fetch plans for the month and default tasks
const fetchPlans = async () => {
  loading.value = true
  try {
    const start = dayjs(currentDate.value).startOf('month').format('YYYY-MM-DD')
    const end = dayjs(currentDate.value).endOf('month').format('YYYY-MM-DD')
    const [plansResult, defaultsResult] = await Promise.all([
      getPlans({ startDate: start, endDate: end }),
      getDefaultTasks(),
    ])
    if (plansResult.data.success) {
      plans.value = plansResult.data.data.plans
    }
    if (defaultsResult.data.success) {
      defaultTasks.value = defaultsResult.data.data.defaultTasks
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取计划失败')
  } finally {
    loading.value = false
  }
}

// Watch for date change to fetch new data if month changed
watch(currentDate, (newDate, oldDate) => {
  if (dayjs(newDate).month() !== dayjs(oldDate).month()) {
    fetchPlans()
  }
})

// Add new task
const handleAddTask = () => {
  selectedPlan.value = null
  modalVisible.value = true
}

// Edit task
const handleEditTask = (plan: Plan) => {
  selectedPlan.value = plan
  modalVisible.value = true
}

// Delete task
const handleDeleteTask = async (plan: Plan) => {
  try {
    const result = await deletePlan(plan.id)
    if (result.data.success) {
      ElMessage.success('删除成功')
      fetchPlans()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

// Toggle complete with animation feedback
const handleToggleComplete = async (plan: Plan) => {
  try {
    // Handle default task: create a copy for today then toggle
    if (plan.isDefault && plan.id < 0) {
      const defaultId = -plan.id
      const task = defaultTasks.value.find(dt => dt.id === defaultId)
      if (!task) return

      // Create a regular plan for today with same title/desc
      const createResult = await createPlan({
        title: task.title,
        description: task.description,
        date: currentDate.value,
      })
      if (createResult.data.success) {
        // Mark as completed immediately
        const newPlan = createResult.data.data.plan
        await toggleComplete(newPlan.id, true)
        ElMessage({
          message: '恭喜！完成一个任务 🎉',
          type: 'success',
          duration: 2000,
        })
        fetchPlans()
      }
      return
    }

    const result = await toggleComplete(plan.id, !plan.isCompleted)
    if (result.data.success) {
      if (!plan.isCompleted) {
        ElMessage({
          message: '恭喜！完成一个任务 🎉',
          type: 'success',
          duration: 2000,
        })
      }
      fetchPlans()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// Handle removing a default task from today
const handleRemoveDefaultTask = async (plan: Plan) => {
  if (!plan.isDefault || plan.id >= 0) return

  const defaultId = -plan.id
  const hidden = getHiddenDefaults(currentDate.value)
  if (!hidden.includes(defaultId)) {
    hidden.push(defaultId)
    setHiddenDefaults(currentDate.value, hidden)
  }

  // Also delete any regular plan created from this default today
  const task = defaultTasks.value.find(dt => dt.id === defaultId)
  const addedPlan = task ? findAddedPlan(task) : undefined
  if (addedPlan) {
    try {
      await deletePlan(addedPlan.id)
    } catch {
      // ignore
    }
  }

  ElMessage.success('已从今天移除')
  fetchPlans()
}

// Modal success
const handleModalSuccess = () => {
  fetchPlans()
}



// Calendar date click for adding
const handleCalendarDateClick = (date: string) => {
  currentDate.value = date
  showCalendar.value = false
  handleAddTask()
}

onMounted(() => {
  fetchPlans()
})
</script>

<template>
  <div class="daily-task-view">
    <!-- Header with progress -->
    <DailyHeader
      v-model:currentDate="currentDate"
      :completed-count="completedCount"
      :total-count="totalCount"
      @open-calendar="showCalendar = true"
    />

    <!-- Main Content -->
    <main class="daily-content">
      <!-- Empty State -->
      <div v-if="!loading && dailyPlans.length === 0" class="empty-state">
        <div class="empty-illustration">
          <div class="empty-icon">📝</div>
          <div class="empty-rings">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h2 class="empty-title">今天还没有任务</h2>
        <p class="empty-desc">添加一个任务，开始高效的一天！</p>
        <button class="empty-add-btn" @click="handleAddTask">
          <Plus />
          添加第一个任务
        </button>
      </div>

      <!-- Task List -->
      <div v-else class="task-list-container">
        <!-- Completion Celebration -->
        <Transition
          enter-active-class="celebration-enter-active"
          enter-from-class="celebration-enter-from"
          enter-to-class="celebration-enter-to"
        >
          <div v-show="showCelebration" class="celebration-banner">
            <div class="celebration-content">
              <Trophy class="trophy-icon" />
              <span>太棒了！今日任务全部完成！</span>
            </div>
          </div>
        </Transition>

        <!-- Tasks -->
        <div class="task-list">
          <TaskItem
            v-for="(plan, index) in dailyPlans"
            :key="plan.id"
            :plan="plan"
            :index="index"
            @toggle-complete="handleToggleComplete"
            @edit="handleEditTask"
            @delete="plan.isDefault && plan.id < 0 ? handleRemoveDefaultTask(plan) : handleDeleteTask(plan)"
          />
        </div>
      </div>
    </main>

    <!-- Calendar Drawer -->
    <Transition name="slide-up">
      <div v-if="showCalendar" class="calendar-drawer">
        <div class="drawer-overlay" @click="showCalendar = false" />
        <div class="drawer-content">
          <div class="drawer-header">
            <h3 class="drawer-title">
              <CalendarIcon />
              选择日期
            </h3>
            <button class="drawer-close" @click="showCalendar = false">
              ✕
            </button>
          </div>
          <CalendarView
            v-model:current-date="currentDate"
            :plans="monthPlans"
            @date-click="handleCalendarDateClick"
          />
        </div>
      </div>
    </Transition>

    <!-- Floating Add Button -->
    <button
      class="fab"
      @click="handleAddTask"
      aria-label="添加任务"
    >
      <Plus />
    </button>

    <!-- Plan Modal -->
    <PlanModal
      v-model:visible="modalVisible"
      :date="currentDate"
      :plan="selectedPlan"
      @success="handleModalSuccess"
    />
  </div>
</template>

<style scoped>
.daily-task-view {
  min-height: 100vh;
  padding-bottom: 100px;
  max-width: 480px;
  margin: 0 auto;
}

/* Content Area */
.daily-content {
  padding: 20px 16px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-illustration {
  position: relative;
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 64px;
  position: relative;
  z-index: 2;
  animation: float 3s ease-in-out infinite;
}

.empty-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.empty-rings span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid var(--color-primary-lighter);
  border-radius: 50%;
  animation: ripple 2s ease-out infinite;
}

.empty-rings span:nth-child(1) {
  width: 80px;
  height: 80px;
  animation-delay: 0s;
}

.empty-rings span:nth-child(2) {
  width: 100px;
  height: 100px;
  animation-delay: 0.5s;
}

.empty-rings span:nth-child(3) {
  width: 120px;
  height: 120px;
  animation-delay: 1s;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.empty-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  font-size: 16px;
  font-weight: 700;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.35);
  transition: all var(--transition-fast);
}

.empty-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
}

.empty-add-btn:active {
  transform: scale(0.98);
}

.empty-add-btn svg {
  width: 20px;
  height: 20px;
}

/* Task List */
.task-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.celebration-banner {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.3);
}

.celebration-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  font-weight: 700;
  font-size: 15px;
}

.trophy-icon {
  width: 24px;
  height: 24px;
  animation: trophyBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
  transition: all var(--transition-spring);
  z-index: 100;
}

.fab:hover {
  transform: scale(1.08) rotate(90deg);
  box-shadow: 0 10px 28px rgba(236, 72, 153, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

.fab svg {
  width: 26px;
  height: 26px;
}

/* Calendar Drawer */
.calendar-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.drawer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.drawer-content {
  position: relative;
  background: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s var(--transition-spring);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--color-gray-100);
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.drawer-title svg {
  width: 24px;
  height: 24px;
  color: var(--color-primary);
}

.drawer-close {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.drawer-close:hover {
  background: var(--color-gray-100);
  color: var(--text-primary);
}

/* Celebration Banner Transitions */
.celebration-enter-active {
  transition: all 0.5s var(--transition-spring);
}

.celebration-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.celebration-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Task Item Stagger Animation */
.task-list .task-item {
  animation: slideUp 0.4s var(--transition-spring) backwards;
}

/* Confetti burst animation for celebration */
@keyframes confettiBurst {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(1.5) rotate(180deg);
    opacity: 0;
  }
}

/* Trophy bounce animation - more lively */
@keyframes trophyBounce {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  25% {
    transform: translateY(-6px) rotate(-10deg) scale(1.1);
  }
  50% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  75% {
    transform: translateY(-3px) rotate(5deg) scale(1.05);
  }
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-active .drawer-content,
.slide-up-leave-active .drawer-content {
  transition: transform 0.3s var(--transition-spring);
}

.slide-up-enter-from .drawer-content,
.slide-up-leave-to .drawer-content {
  transform: translateY(100%);
}

/* Desktop Responsive */
@media (min-width: 769px) {
  .daily-task-view {
    max-width: 480px;
    margin: 40px auto;
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    min-height: auto;
    padding-bottom: 80px;
    overflow: hidden;
  }

  .calendar-drawer .drawer-content {
    max-height: 500px;
  }
}
</style>
