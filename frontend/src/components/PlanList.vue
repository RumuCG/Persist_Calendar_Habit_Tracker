<script setup lang="ts">
import { Edit, Delete } from '@element-plus/icons-vue'
import type { Plan } from '@/api/plan'

interface Props {
  plans: Plan[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'toggle-complete': [plan: Plan]
  'edit': [plan: Plan]
  'delete': [plan: Plan]
}>()

const handleToggleComplete = (plan: Plan) => {
  emit('toggle-complete', plan)
}

const handleEdit = (plan: Plan) => {
  emit('edit', plan)
}

const handleDelete = (plan: Plan) => {
  emit('delete', plan)
}
</script>

<template>
  <div class="plan-list">
    <!-- Empty State -->
    <div v-if="!loading && plans.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty-text">暂无任务</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <div v-for="n in 3" :key="n" class="skeleton-item">
        <div class="skeleton-checkbox" />
        <div class="skeleton-content">
          <div class="skeleton-title" />
          <div class="skeleton-desc" />
        </div>
      </div>
    </div>

    <!-- Plan Items -->
    <div v-else class="plan-items">
      <div
        v-for="(plan, index) in plans"
        :key="plan.id"
        class="plan-item"
        :class="{ 'is-completed': plan.isCompleted }"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div class="plan-content">
          <button
            class="checkbox-btn"
            :class="{ 'is-checked': plan.isCompleted }"
            @click="handleToggleComplete(plan)"
            :aria-label="plan.isCompleted ? '标记为未完成' : '标记为已完成'"
          >
            <svg v-if="plan.isCompleted" class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>

          <div class="plan-info" @click="handleToggleComplete(plan)">
            <span class="plan-title">{{ plan.title }}</span>
            <span v-if="plan.description" class="plan-description">
              {{ plan.description }}
            </span>
            <span v-if="plan.time" class="plan-time">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" stroke-linecap="round" />
              </svg>
              {{ plan.time }}
            </span>
          </div>
        </div>

        <div class="plan-actions">
          <button class="action-btn" @click="handleEdit(plan)" aria-label="编辑">
            <Edit />
          </button>
          <button class="action-btn delete" @click="handleDelete(plan)" aria-label="删除">
            <Delete />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-list {
  min-height: 100px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 500;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: var(--radius-lg);
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-gray-200);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 16px;
  width: 60%;
  background: var(--color-gray-200);
  border-radius: var(--radius-sm);
}

.skeleton-desc {
  height: 12px;
  width: 40%;
  background: var(--color-gray-200);
  border-radius: var(--radius-sm);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Plan Items */
.plan-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-100);
  transition: all var(--transition-fast);
  animation: slideUp 0.3s ease backwards;
}

.plan-item:hover {
  border-color: var(--color-primary-lighter);
  box-shadow: var(--shadow-sm);
}

.plan-item.is-completed {
  background-color: var(--color-gray-50);
  border-color: var(--color-gray-100);
}

.plan-item.is-completed .plan-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.plan-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* Checkbox */
.checkbox-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-gray-300);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
  transition: all var(--transition-spring);
}

.checkbox-btn:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-lighter);
}

.checkbox-btn.is-checked {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-color: var(--color-primary);
}

.check-svg {
  width: 14px;
  height: 14px;
  color: white;
  animation: scaleIn 0.2s ease;
}

/* Plan Info */
.plan-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.plan-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  transition: color var(--transition-fast);
}

.plan-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.plan-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.plan-time svg {
  width: 12px;
  height: 12px;
}

/* Actions */
.plan-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.plan-item:hover .plan-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-gray-100);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  background: #fef2f2;
  color: var(--color-danger);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .plan-item {
    padding: 12px 14px;
  }

  .plan-actions {
    opacity: 1;
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
  .plan-item {
    padding: 10px 12px;
    border-radius: var(--radius-md);
  }

  .plan-title {
    font-size: 14px;
  }

  .plan-description {
    font-size: 12px;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
