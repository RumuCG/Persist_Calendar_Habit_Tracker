<template>
  <div class="focus-view">
    <!-- 准备阶段 -->
    <div v-if="isIdle" class="focus-setup">
      <h2 class="title">开始专注</h2>

      <!-- 标题输入 -->
      <div class="input-section">
        <el-input
          v-model="title"
          placeholder="你在专注做什么？（如：阅读、写作、编程）"
          size="large"
          maxlength="50"
          show-word-limit
          class="title-input"
        />
      </div>

      <!-- 计时模式选择 -->
      <div class="mode-section">
        <label class="section-label">计时模式</label>
        <el-radio-group v-model="timerMode" size="large">
          <el-radio-button label="COUNTDOWN">倒计时</el-radio-button>
          <el-radio-button label="STOPWATCH">正计时</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 倒计时预设 -->
      <div v-if="timerMode === 'COUNTDOWN'" class="duration-section">
        <label class="section-label">专注时长</label>
        <div class="duration-presets">
          <el-button
            v-for="preset in durationPresets"
            :key="preset.value"
            :type="expectedDuration === preset.value ? 'primary' : 'default'"
            @click="setExpectedDuration(preset.value)"
            size="large"
          >
            {{ preset.label }}
          </el-button>
        </div>
        <el-slider
          v-model="expectedDuration"
          :min="300"
          :max="7200"
          :step="300"
          show-stops
          class="duration-slider"
        />
        <div class="duration-display">
          {{ Math.floor(expectedDuration / 60) }} 分钟
        </div>
      </div>

      <!-- 开始按钮 -->
      <el-button
        type="primary"
        size="large"
        class="start-button"
        :loading="loading"
        @click="handleStart"
      >
        <el-icon class="button-icon"><Timer /></el-icon>
        开始专注
      </el-button>
    </div>

    <!-- 专注中 -->
    <div v-else class="focus-active">
      <!-- 标题显示 -->
      <div class="focus-title">{{ currentSession?.title || title || '未命名专注' }}</div>

      <!-- 计时器显示 -->
      <div class="timer-display">
        <el-progress
          v-if="timerMode === 'COUNTDOWN'"
          type="circle"
          :percentage="progress"
          :stroke-width="12"
          :width="280"
          :color="progressColors"
          class="timer-progress"
        >
          <div class="timer-text">{{ formattedRemainingTime }}</div>
        </el-progress>
        <div v-else class="stopwatch-display">
          {{ formattedElapsedTime }}
        </div>
      </div>

      <!-- 模式标签 -->
      <div class="mode-tag">
        <el-tag :type="timerMode === 'COUNTDOWN' ? 'primary' : 'success'" size="large">
          {{ timerMode === 'COUNTDOWN' ? '倒计时' : '正计时' }}
        </el-tag>
      </div>

      <!-- 控制按钮 -->
      <div class="control-buttons">
        <el-button
          type="danger"
          size="large"
          class="control-button"
          @click="showGiveUpDialog = true"
        >
          <el-icon class="button-icon"><CircleClose /></el-icon>
          放弃
        </el-button>
        <el-button
          type="success"
          size="large"
          class="control-button"
          @click="handleComplete"
        >
          <el-icon class="button-icon"><CircleCheck /></el-icon>
          完成
        </el-button>
      </div>
    </div>

    <!-- 放弃对话框 -->
    <el-dialog
      v-model="showGiveUpDialog"
      title="放弃专注"
      width="400px"
      center
    >
      <p>确定要放弃这次专注吗？</p>
      <el-input
        v-model="interruptReason"
        placeholder="请简单说明原因（可选）"
        type="textarea"
        :rows="3"
      />
      <template #footer>
        <el-button @click="showGiveUpDialog = false">取消</el-button>
        <el-button type="danger" @click="handleGiveUp" :loading="loading">
          确认放弃
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Timer, CircleClose, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useFocusStore } from '@/stores/focus'
import { storeToRefs } from 'pinia'

const focusStore = useFocusStore()
const {
  timerMode,
  expectedDuration,
  currentSession,
  loading,
  formattedRemainingTime,
  formattedElapsedTime,
  progress,
  isIdle,
} = storeToRefs(focusStore)

const { setExpectedDuration } = focusStore

// 本地状态
const title = ref('')
const showGiveUpDialog = ref(false)
const interruptReason = ref('')
const timerInterval = ref<number | null>(null)

// 时长预设
const durationPresets = [
  { label: '15分钟', value: 15 * 60 },
  { label: '25分钟', value: 25 * 60 },
  { label: '45分钟', value: 45 * 60 },
  { label: '60分钟', value: 60 * 60 },
]

// 进度条颜色
const progressColors = computed(() => {
  if (progress.value < 30) return '#67C23A'
  if (progress.value < 70) return '#E6A23C'
  return '#F56C6C'
})

// 监听计时模式变化，重置时长
watch(timerMode, (newMode) => {
  if (newMode === 'COUNTDOWN') {
    focusStore.setExpectedDuration(25 * 60)
  }
})

// 开始专注
async function handleStart() {
  if (!title.value.trim()) {
    title.value = '未命名专注'
  }

  focusStore.setTitle(title.value)

  try {
    await focusStore.startFocus()
    startTimer()
    ElMessage.success('专注开始！保持专注，你可以的！')
  } catch (error) {
    ElMessage.error('开始专注失败，请重试')
  }
}

// 完成专注
async function handleComplete() {
  try {
    await focusStore.endFocus(true)
    stopTimer()
    ElMessage.success('恭喜！完成一次专注！')
    resetForm()
  } catch (error) {
    ElMessage.error('保存专注记录失败')
  }
}

// 放弃专注
async function handleGiveUp() {
  try {
    await focusStore.endFocus(false, interruptReason.value)
    stopTimer()
    ElMessage.info('已放弃本次专注')
    showGiveUpDialog.value = false
    interruptReason.value = ''
    resetForm()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 重置表单
function resetForm() {
  title.value = ''
  focusStore.reset()
}

// 启动计时器
function startTimer() {
  if (timerInterval.value) return

  timerInterval.value = window.setInterval(() => {
    focusStore.tick()
  }, 1000)
}

// 停止计时器
function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// 页面加载时恢复会话
onMounted(async () => {
  await focusStore.restoreSession()

  if (focusStore.isRunning) {
    startTimer()
  }
})

// 页面卸载时清理
onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped lang="scss">
.focus-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

// 准备阶段样式
.focus-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;

  .title {
    font-size: 32px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .input-section {
    width: 100%;
    max-width: 480px;

    .title-input {
      :deep(.el-input__inner) {
        font-size: 16px;
        text-align: center;
      }
    }
  }

  .mode-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .section-label {
      font-size: 14px;
      color: #606266;
    }
  }

  .duration-section {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .section-label {
      font-size: 14px;
      color: #606266;
    }

    .duration-presets {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .duration-slider {
      width: 100%;
      margin-top: 8px;
    }

    .duration-display {
      font-size: 18px;
      font-weight: 600;
      color: #409EFF;
    }
  }

  .start-button {
    width: 200px;
    height: 56px;
    font-size: 18px;
    border-radius: 28px;

    .button-icon {
      margin-right: 8px;
      font-size: 20px;
    }
  }
}

// 专注中样式
.focus-active {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  animation: fadeIn 0.3s ease;

  .focus-title {
    font-size: 24px;
    font-weight: 500;
    color: #303133;
    text-align: center;
  }

  .timer-display {
    margin: 20px 0;

    .timer-progress {
      :deep(.el-progress-circle__track) {
        stroke: #EBEEF5;
      }
    }

    .timer-text {
      font-size: 56px;
      font-weight: 700;
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
      color: #303133;
      letter-spacing: 4px;
    }

    .stopwatch-display {
      font-size: 72px;
      font-weight: 700;
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
      color: #303133;
      letter-spacing: 4px;
      text-align: center;
      min-width: 300px;
    }
  }

  .mode-tag {
    margin-top: -16px;
  }

  .control-buttons {
    display: flex;
    gap: 24px;
    margin-top: 16px;

    .control-button {
      width: 140px;
      height: 48px;
      font-size: 16px;
      border-radius: 24px;

      .button-icon {
        margin-right: 6px;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .focus-view {
    padding: 24px 16px;
  }

  .focus-setup {
    gap: 24px;

    .title {
      font-size: 24px;
    }

    .duration-presets {
      gap: 8px;

      .el-button {
        padding: 8px 16px;
        font-size: 14px;
      }
    }

    .start-button {
      width: 100%;
      max-width: 280px;
    }
  }

  .focus-active {
    .timer-display {
      .timer-text {
        font-size: 40px;
      }

      .stopwatch-display {
        font-size: 52px;
        min-width: 240px;
      }
    }

    .focus-title {
      font-size: 18px;
    }

    .control-buttons {
      gap: 16px;
      width: 100%;
      padding: 0 16px;

      .control-button {
        flex: 1;
        width: auto;
      }
    }
  }
}
</style>
