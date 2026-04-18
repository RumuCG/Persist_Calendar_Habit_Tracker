<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CalendarView from '@/components/CalendarView.vue'
import PlanList from '@/components/PlanList.vue'
import PlanModal from '@/components/PlanModal.vue'
import { getPlans, toggleComplete, deletePlan, type Plan } from '@/api/plan'

// Current date
const currentDate = ref(dayjs().format('YYYY-MM-DD'))

// Plans list
const plans = ref<Plan[]>([])
const loading = ref(false)

// Modal control
const modalVisible = ref(false)
const selectedDate = ref('')
const selectedPlan = ref<Plan | null>(null)

// Calculate plans for selected date
const selectedDatePlans = computed(() => {
  return plans.value.filter(plan => plan.date === selectedDate.value)
})

// Calculate current month range
const currentMonthRange = computed(() => {
  const start = dayjs(currentDate.value).startOf('month').format('YYYY-MM-DD')
  const end = dayjs(currentDate.value).endOf('month').format('YYYY-MM-DD')
  return { start, end }
})

// Fetch plans
const fetchPlans = async () => {
  loading.value = true
  try {
    const { start, end } = currentMonthRange.value
    const result = await getPlans({ startDate: start, endDate: end })
    if (result.data.success) {
      plans.value = result.data.data.plans
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取计划失败')
  } finally {
    loading.value = false
  }
}

// Watch month changes
watch(() => currentMonthRange.value.start, () => {
  fetchPlans()
})

// Date click event
const handleDateClick = (date: string) => {
  selectedDate.value = date
  selectedPlan.value = null
  modalVisible.value = true
}

// Add plan
const handleAddPlan = () => {
  selectedDate.value = dayjs().format('YYYY-MM-DD')
  selectedPlan.value = null
  modalVisible.value = true
}

// Edit plan
const handleEditPlan = (plan: Plan) => {
  selectedDate.value = plan.date
  selectedPlan.value = plan
  modalVisible.value = true
}

// Delete plan
const handleDeletePlan = async (plan: Plan) => {
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

// Toggle complete
const handleToggleComplete = async (plan: Plan) => {
  try {
    const result = await toggleComplete(plan.id, !plan.isCompleted)
    if (result.data.success) {
      ElMessage.success(!plan.isCompleted ? '已完成' : '已取消完成')
      fetchPlans()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// Modal success callback
const handleModalSuccess = () => {
  fetchPlans()
}

onMounted(() => {
  fetchPlans()
  selectedDate.value = dayjs().format('YYYY-MM-DD')
})
</script>

<template>
  <div class="calendar-page">
    <div class="calendar-container">
      <div class="calendar-toolbar">
        <h1 class="page-title">日历视图</h1>
        <button class="add-btn" @click="handleAddPlan">
          <Plus />
          添加计划
        </button>
      </div>

      <div class="calendar-content">
        <div class="calendar-main">
          <CalendarView
            v-model:current-date="currentDate"
            :plans="plans"
            @date-click="handleDateClick"
          />
        </div>

        <aside class="calendar-sidebar">
          <div class="sidebar-header">
            <h3 class="sidebar-title">
              {{ dayjs(selectedDate).format('M月D日') }} 任务
            </h3>
          </div>

          <div class="sidebar-content">
            <PlanList
              :plans="selectedDatePlans"
              :loading="loading"
              @toggle-complete="handleToggleComplete"
              @edit="handleEditPlan"
              @delete="handleDeletePlan"
            />
          </div>

          <div class="sidebar-footer">
            <button class="sidebar-add-btn" @click="handleAddPlan">
              <Plus />
              添加任务
            </button>
          </div>
        </aside>
      </div>
    </div>

    <PlanModal
      v-model:visible="modalVisible"
      :date="selectedDate"
      :plan="selectedPlan"
      @success="handleModalSuccess"
    />
  </div>
</template>

<style scoped>
.calendar-page {
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-container {
  background: white;
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-gray-100);
}

.page-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all var(--transition-fast);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.add-btn svg {
  width: 18px;
  height: 18px;
}

.calendar-content {
  display: flex;
  gap: 24px;
}

.calendar-main {
  flex: 1;
  min-width: 0;
}

.calendar-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.sidebar-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-gray-200);
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.sidebar-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-gray-200);
}

.sidebar-add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px dashed var(--color-gray-300);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.sidebar-add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-lightest);
}

.sidebar-add-btn svg {
  width: 18px;
  height: 18px;
}

/* Tablet */
@media (max-width: 1024px) {
  .calendar-content {
    flex-direction: column;
  }

  .calendar-sidebar {
    width: 100%;
    max-height: 300px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .calendar-page {
    padding: 16px;
  }

  .calendar-container {
    padding: 16px;
    border-radius: var(--radius-lg);
  }

  .calendar-toolbar {
    margin-bottom: 16px;
    padding-bottom: 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .calendar-sidebar {
    display: none;
  }
}

@media (max-width: 480px) {
  .calendar-page {
    padding: 12px;
  }

  .calendar-container {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .add-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .add-btn span {
    display: none;
  }
}
</style>
