<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Edit, Delete, Star } from '@element-plus/icons-vue'
import {
  getDefaultTasks,
  createDefaultTask,
  updateDefaultTask,
  deleteDefaultTask,
  type DefaultTask,
} from '@/api/plan'

const router = useRouter()

const tasks = ref<DefaultTask[]>([])
const loading = ref(false)

// Modal control
const modalVisible = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('')
const formDescription = ref('')
const formLoading = ref(false)

const fetchTasks = async () => {
  loading.value = true
  try {
    const result = await getDefaultTasks()
    if (result.data.success) {
      tasks.value = result.data.data.defaultTasks
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取默认任务失败')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditMode.value = false
  editingId.value = null
  formTitle.value = ''
  formDescription.value = ''
  modalVisible.value = true
}

const openEditModal = (task: DefaultTask) => {
  isEditMode.value = true
  editingId.value = task.id
  formTitle.value = task.title
  formDescription.value = task.description || ''
  modalVisible.value = true
}

const handleSubmit = async () => {
  if (!formTitle.value.trim()) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (formTitle.value.trim().length > 200) {
    ElMessage.warning('任务名称不能超过200个字符')
    return
  }

  formLoading.value = true
  try {
    if (isEditMode.value && editingId.value !== null) {
      const result = await updateDefaultTask(editingId.value, {
        title: formTitle.value.trim(),
        description: formDescription.value.trim() || undefined,
      })
      if (result.data.success) {
        ElMessage.success('更新成功')
        modalVisible.value = false
        fetchTasks()
      }
    } else {
      const result = await createDefaultTask({
        title: formTitle.value.trim(),
        description: formDescription.value.trim() || undefined,
      })
      if (result.data.success) {
        ElMessage.success('添加成功')
        modalVisible.value = false
        fetchTasks()
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (task: DefaultTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除默认任务「${task.title}」吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await deleteDefaultTask(task.id)
    ElMessage.success('删除成功')
    fetchTasks()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const goBack = () => router.push('/profile')

onMounted(() => {
  fetchTasks()
})

// Expose for tests
defineExpose({
  tasks,
  loading,
  modalVisible,
  isEditMode,
  editingId,
  formTitle,
  formDescription,
  openEditModal,
  handleSubmit,
})
</script>

<template>
  <div class="default-tasks-page">
    <div class="default-tasks-container">
      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" @click="goBack">
          <ArrowLeft />
          <span>返回</span>
        </button>
        <h1 class="page-title">
          <Star class="title-icon" />
          默认任务管理
        </h1>
        <div class="spacer"></div>
      </div>

      <!-- Description -->
      <p class="page-desc">
        设置每日默认任务，它们将自动出现在每一天的日程中。
      </p>

      <!-- Empty State -->
      <div v-if="!loading && tasks.length === 0" class="empty-state">
        <div class="empty-icon">⭐</div>
        <h2 class="empty-title">还没有默认任务</h2>
        <p class="empty-desc">
          添加一些每日必做的任务，比如「晨跑」「阅读30分钟」
        </p>
        <button class="empty-add-btn" @click="openAddModal">
          <Plus />
          添加默认任务
        </button>
      </div>

      <!-- Task List -->
      <div v-else class="task-list">
        <div
          v-for="(task, index) in tasks"
          :key="task.id"
          class="task-card"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="task-info">
            <h3 class="task-title">{{ task.title }}</h3>
            <p v-if="task.description" class="task-desc">
              {{ task.description }}
            </p>
          </div>
          <div class="task-actions">
            <button
              class="action-btn edit-btn"
              @click="openEditModal(task)"
              aria-label="编辑"
            >
              <Edit />
            </button>
            <button
              class="action-btn delete-btn"
              @click="handleDelete(task)"
              aria-label="删除"
            >
              <Delete />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Add Button -->
    <button
      v-if="tasks.length > 0"
      class="fab"
      @click="openAddModal"
      aria-label="添加默认任务"
    >
      <Plus />
    </button>

    <!-- Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="isEditMode ? '编辑默认任务' : '添加默认任务'"
      width="90%"
      :close-on-click-modal="false"
      class="task-modal"
    >
      <el-form label-position="top" class="task-form">
        <el-form-item label="任务名称" required>
          <el-input
            v-model="formTitle"
            placeholder="例如：晨跑、阅读30分钟..."
            maxlength="200"
            size="large"
          />
        </el-form-item>
        <el-form-item label="描述（可选）">
          <el-input
            v-model="formDescription"
            type="textarea"
            :rows="3"
            placeholder="添加一些说明..."
            maxlength="500"
            show-word-limit
            resize="none"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="modal-footer">
          <el-button @click="modalVisible = false" size="large">
            取消
          </el-button>
          <el-button
            type="primary"
            size="large"
            :loading="formLoading"
            @click="handleSubmit"
            class="submit-btn"
          >
            {{ isEditMode ? '保存' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.default-tasks-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #ffe4e6 100%);
  background-attachment: fixed;
}

.default-tasks-container {
  max-width: 640px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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

.title-icon {
  width: 26px;
  height: 26px;
  color: var(--color-accent-dark);
}

.spacer {
  width: 80px;
}

.page-desc {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  max-width: 300px;
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
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.45);
}

.empty-add-btn svg {
  width: 20px;
  height: 20px;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  animation: slideUp 0.4s var(--transition-spring) backwards;
  border: 2px solid transparent;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-lighter);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.task-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  color: var(--text-tertiary);
  background: var(--color-gray-50);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn:hover {
  transform: scale(1.1);
}

.edit-btn:hover {
  color: var(--color-info);
  background: #eff6ff;
}

.delete-btn:hover {
  color: var(--color-danger);
  background: #fef2f2;
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
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
  transform: translateX(-50%) scale(1.05) rotate(90deg);
  box-shadow: 0 10px 28px rgba(236, 72, 153, 0.5);
}

.fab:active {
  transform: translateX(-50%) scale(0.95);
}

.fab svg {
  width: 26px;
  height: 26px;
}

/* Modal */
.task-form {
  padding: 8px 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.submit-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border: none;
  padding: 0 24px;
}

:deep(.task-modal .el-dialog__header) {
  padding: 20px 20px 0;
  margin-bottom: 16px;
}

:deep(.task-modal) {
  max-width: 480px;
}

:deep(.task-modal .el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.task-modal .el-dialog__body) {
  padding: 0 20px;
}

:deep(.task-modal .el-dialog__footer) {
  padding: 16px 20px 20px;
  border-top: 1px solid var(--color-gray-100);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 6px;
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .default-tasks-page {
    padding: 16px;
  }

  .page-title {
    font-size: 18px;
  }

  .title-icon {
    width: 22px;
    height: 22px;
  }

  .spacer {
    width: 60px;
  }

  .task-card {
    padding: 14px 16px;
  }

  .task-title {
    font-size: 15px;
  }

  .fab {
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .back-btn span {
    display: none;
  }

  .page-desc {
    font-size: 13px;
  }

  .task-actions {
    flex-direction: column;
  }
}
</style>
