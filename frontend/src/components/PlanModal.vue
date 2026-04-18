<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createPlan, updatePlan, deletePlan, type Plan } from '@/api/plan'

interface Props {
  visible: boolean
  date: string
  plan?: Plan | null
}

const props = withDefaults(defineProps<Props>(), {
  plan: null,
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  success: []
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)

// 判断是新增还是编辑模式
const isEditMode = computed(() => !!props.plan)

// 表单数据
const form = reactive({
  title: '',
  description: '',
  date: '',
  time: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  isCompleted: false,
})

// 表单校验规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { max: 100, message: '标题最多100个字符', trigger: 'blur' },
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' },
  ],
  description: [
    { max: 500, message: '备注最多500个字符', trigger: 'blur' },
  ],
}

// 监听弹窗显示和计划数据变化
watch(() => props.visible, (visible) => {
  if (visible) {
    if (props.plan) {
      // 编辑模式：填充表单
      form.title = props.plan.title
      form.description = props.plan.description || ''
      form.date = props.plan.date
      form.time = props.plan.time || ''
      form.priority = props.plan.priority || 'medium'
      form.isCompleted = props.plan.isCompleted
    } else {
      // 新增模式：重置表单
      form.title = ''
      form.description = ''
      form.date = props.date
      form.time = ''
      form.priority = 'medium'
      form.isCompleted = false
    }
  }
})

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditMode.value && props.plan) {
        // 编辑模式
        const result = await updatePlan(props.plan.id, {
          title: form.title,
          description: form.description,
          date: form.date,
          time: form.time,
          priority: form.priority,
        })
        if (result.data.success) {
          ElMessage.success('更新成功')
          emit('success')
          handleClose()
        }
      } else {
        // 新增模式
        const result = await createPlan({
          title: form.title,
          description: form.description,
          date: form.date,
          time: form.time,
          priority: form.priority,
        })
        if (result.data.success) {
          ElMessage.success('添加成功')
          emit('success')
          handleClose()
        }
      }
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      loading.value = false
    }
  })
}

// 删除计划
const handleDelete = async () => {
  if (!props.plan) return

  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    const result = await deletePlan(props.plan.id)
    if (result.data.success) {
      ElMessage.success('删除成功')
      emit('success')
      handleClose()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 优先级选项
const priorityOptions = [
  { label: '高优先级', value: 'high', color: '#ef4444' },
  { label: '中优先级', value: 'medium', color: '#f59e0b' },
  { label: '低优先级', value: 'low', color: '#3b82f6' },
]
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEditMode ? '编辑任务' : '新建任务'"
    width="90%"
    :close-on-click-modal="false"
    class="task-modal"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="task-form"
    >
      <!-- Title Input with Icon -->
      <el-form-item label="任务名称" prop="title">
        <el-input
          v-model="form.title"
          placeholder="要做什么？"
          maxlength="100"
          size="large"
          class="title-input"
        >
          <template #prefix>
            <span class="input-icon">✏️</span>
          </template>
        </el-input>
      </el-form-item>

      <!-- Date & Time Row -->
      <div class="form-row">
        <el-form-item label="日期" prop="date" class="form-item-half">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            size="large"
            class="full-width"
          />
        </el-form-item>

        <el-form-item label="时间（可选）" class="form-item-half">
          <el-time-picker
            v-model="form.time"
            placeholder="选择时间"
            value-format="HH:mm"
            format="HH:mm"
            size="large"
            class="full-width"
          />
        </el-form-item>
      </div>

      <!-- Priority Selection -->
      <el-form-item label="优先级">
        <div class="priority-selector">
          <button
            v-for="option in priorityOptions"
            :key="option.value"
            type="button"
            class="priority-btn"
            :class="{ active: form.priority === option.value }"
            :style="{
              backgroundColor: form.priority === option.value ? option.color + '20' : 'transparent',
              borderColor: form.priority === option.value ? option.color : 'transparent',
              color: option.color
            }"
            @click="form.priority = option.value as any"
          >
            <span class="priority-dot" :style="{ backgroundColor: option.color }"></span>
            {{ option.label }}
          </button>
        </div>
      </el-form-item>

      <!-- Description -->
      <el-form-item label="备注（可选）" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="添加一些备注..."
          maxlength="500"
          show-word-limit
          resize="none"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="modal-footer">
        <el-button
          v-if="isEditMode"
          type="danger"
          text
          @click="handleDelete"
        >
          <template #icon>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </template>
          删除
        </el-button>
        <div class="footer-actions">
          <el-button @click="handleClose" size="large">取消</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleSubmit"
            class="submit-btn"
          >
            {{ isEditMode ? '保存' : '添加任务' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.task-form {
  padding: 8px 0;
}

.input-icon {
  font-size: 18px;
  margin-right: 4px;
}

:deep(.title-input .el-input__inner) {
  font-size: 16px;
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-item-half {
  flex: 1;
  margin-bottom: 18px;
}

.full-width {
  width: 100%;
}

/* Priority Selector */
.priority-selector {
  display: flex;
  gap: 10px;
}

.priority-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.priority-btn:hover {
  background-color: var(--color-gray-100);
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.submit-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border: none;
  padding: 0 24px;
}

/* Dialog styling */
:deep(.task-modal .el-dialog__header) {
  padding: 20px 20px 0;
  margin-bottom: 16px;
}

:deep(.task-modal) {
  max-width: 520px;
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

:deep(.task-modal .el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 6px;
}

/* Mobile */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .priority-selector {
    flex-wrap: wrap;
  }

  .priority-btn {
    font-size: 13px;
    padding: 8px 10px;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .footer-actions {
    width: 100%;
  }

  .footer-actions .el-button {
    flex: 1;
  }
}
</style>
