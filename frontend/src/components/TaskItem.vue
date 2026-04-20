<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Star } from '@element-plus/icons-vue'
import type { Plan } from '@/api/plan'

interface Props {
  plan: Plan
  index?: number
}

const props = withDefaults(defineProps<Props>(), {
  index: 0,
})

const emit = defineEmits<{
  'toggle-complete': [plan: Plan]
  'edit': [plan: Plan]
  'delete': [plan: Plan]
}>()

const isChecking = ref(false)
const showConfetti = ref(false)

const handleToggleComplete = () => {
  if (isChecking.value) return

  isChecking.value = true

  // If completing the task (not uncompleting), show confetti
  if (!props.plan.isCompleted) {
    showConfetti.value = true
    setTimeout(() => {
      showConfetti.value = false
    }, 800)
  }

  emit('toggle-complete', props.plan)

  setTimeout(() => {
    isChecking.value = false
  }, 400)
}

const handleEdit = () => {
  emit('edit', props.plan)
}

const handleDelete = () => {
  emit('delete', props.plan)
}

// Stagger animation delay based on index
const animationDelay = computed(() => `${props.index * 50}ms`)

// Priority color mapping
const priorityColor = computed(() => {
  switch (props.plan.priority) {
    case 'high':
      return '#ef4444'
    case 'medium':
      return '#f59e0b'
    case 'low':
      return '#3b82f6'
    default:
      return '#10b981'
  }
})
</script>

<template>
  <div
    class="task-item"
    :class="{
      'is-completed': plan.isCompleted,
      'is-checking': isChecking,
      'is-default': plan.isDefault,
    }"
    :style="{ animationDelay }"
  >
    <!-- Confetti Effect -->
    <Transition
      enter-active-class="confetti-enter-active"
      enter-from-class="confetti-enter-from"
      enter-to-class="confetti-enter-to"
    >
      <div v-if="showConfetti" class="confetti-container">
        <span v-for="n in 8" :key="n" class="confetti" :class="`confetti-${n}`" :style="{ '--x': `${(n - 4.5) * 25}px`, '--y': `${-40 - (n % 3) * 20}px`, '--r': `${n * 45}deg`, '--color': ['#10b981', '#fbbf24', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#fbbf24', '#3b82f6'][n - 1] }" />
      </div>
    </Transition>

    <!-- Checkbox with satisfying animation -->
    <button
      class="task-checkbox"
      :class="{ 'is-checked': plan.isCompleted }"
      @click="handleToggleComplete"
      :aria-label="plan.isCompleted ? '标记为未完成' : '标记为已完成'"
    >
      <div class="checkbox-ring">
        <div class="checkbox-inner">
          <Check v-if="plan.isCompleted" class="check-icon" />
          <Star v-else class="sparkle-icon" />
        </div>
      </div>
    </button>

    <!-- Default Badge -->
    <div v-if="plan.isDefault" class="default-badge">
      <Star class="default-icon" />
      <span>默认</span>
    </div>

    <!-- Task Content -->
    <div class="task-content" @click="handleToggleComplete">
      <div class="task-header">
        <h3 class="task-title">{{ plan.title }}</h3>
        <span
          v-if="plan.priority && !plan.isDefault"
          class="task-priority"
          :style="{ backgroundColor: priorityColor + '20', color: priorityColor }"
        >
          {{ plan.priority === 'high' ? '高' : plan.priority === 'medium' ? '中' : '低' }}
        </span>
        <span
          v-if="plan.isDefault"
          class="task-priority default-priority"
        >
          每日默认
        </span>
      </div>
      <p v-if="plan.description" class="task-description">
        {{ plan.description }}
      </p>
      <div class="task-meta">
        <span v-if="plan.time" class="task-time">
          <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round" />
          </svg>
          {{ plan.time }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="task-actions">
      <button
        v-if="!plan.isDefault"
        class="action-btn edit-btn"
        @click.stop="handleEdit"
        aria-label="编辑"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        class="action-btn delete-btn"
        @click.stop="handleDelete"
        :aria-label="plan.isDefault ? '从当天移除' : '删除'"
      >
        <svg v-if="!plan.isDefault" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.task-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-spring);
  animation: slideUp var(--transition-normal) backwards;
  border: 2px solid transparent;
}

.task-item:hover {
  box-shadow: 0 8px 24px -6px rgba(236, 72, 153, 0.15), var(--shadow-md);
  transform: translateY(-3px);
}

.task-item.is-completed {
  background: var(--color-primary-lightest);
  border-color: var(--color-primary-lighter);
}

.task-item.is-default {
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
  border-color: #fbcfe8;
}

.task-item.is-default:hover {
  background: linear-gradient(135deg, #fce7f3 0%, #f9d5e8 100%);
  border-color: #f9a8d4;
}

/* Default Badge */
.default-badge {
  position: absolute;
  top: 8px;
  right: 44px;
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 2;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.task-item:hover .default-badge {
  opacity: 1;
}

.default-icon {
  width: 10px;
  height: 10px;
}

.default-priority {
  background: #fce7f3 !important;
  color: #db2777 !important;
}

.task-item.is-completed .task-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.task-item.is-completed .task-description {
  color: var(--text-tertiary);
}

.task-item.is-checking .checkbox-inner {
  animation: checkPop 0.4s var(--transition-spring);
}

/* Confetti Effect */
.confetti-container {
  position: absolute;
  top: 50%;
  left: 26px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.confetti-enter-active {
  transition: all 0.05s ease;
}

.confetti-enter-from {
  opacity: 0;
}

.confetti-enter-to {
  opacity: 1;
}

.confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background-color: var(--color);
  opacity: 0;
  animation: confetti 0.6s var(--transition-spring) 0.05s forwards;
}

/* Checkbox */
.task-checkbox {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.task-checkbox:active {
  transform: scale(0.95);
}

.checkbox-ring {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  border: 3px solid var(--color-gray-300);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-spring);
}

.task-checkbox:hover .checkbox-ring {
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 4px var(--color-primary-lighter);
}

.task-checkbox.is-checked .checkbox-ring {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.35);
}

.checkbox-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: white;
  animation: scaleIn 0.3s var(--transition-spring);
}

.sparkle-icon {
  width: 14px;
  height: 14px;
  color: var(--color-accent);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.task-checkbox:hover .sparkle-icon {
  opacity: 1;
  animation: float 1.5s ease-in-out infinite;
}

/* Content */
.task-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  padding: 2px 0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.task-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  transition: all var(--transition-normal);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-priority {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.task-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 600;
}

.time-icon {
  width: 14px;
  height: 14px;
}

/* Actions */
.task-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.task-item:hover .task-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  color: var(--text-tertiary);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:hover {
  background: var(--color-gray-100);
}

.edit-btn:hover {
  color: var(--color-info);
  background: #eff6ff;
}

.delete-btn:hover {
  color: var(--color-danger);
  background: #fef2f2;
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .task-item {
    padding: 14px;
    gap: 12px;
  }

  .checkbox-ring {
    width: 26px;
    height: 26px;
  }

  .check-icon {
    width: 14px;
    height: 14px;
  }

  .task-title {
    font-size: 15px;
  }

  .task-description {
    font-size: 13px;
  }

  .task-actions {
    opacity: 1;
    flex-direction: row;
    gap: 2px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  .action-btn svg {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .task-item {
    padding: 12px;
    border-radius: var(--radius-md);
  }

  .checkbox-ring {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }

  .task-title {
    font-size: 14px;
  }

  .task-priority {
    font-size: 10px;
    padding: 1px 6px;
  }
}
</style>
