import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, logout as logoutApi, getCurrentUser, type User, type LoginData, type RegisterData } from '@/api/auth'
import { getDefaultTasks, createDefaultTask, updateDefaultTask, deleteDefaultTask, type DefaultTask, type CreateDefaultTaskData } from '@/api/plan'
import { ElMessage } from 'element-plus'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const loading = ref(false)
  const initialized = ref(false)

  // Default tasks state
  const defaultTasks = ref<DefaultTask[]>([])
  const defaultTasksLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => isLoggedIn.value && user.value !== null)

  // Default tasks getters
  const defaultTasksCount = computed(() => defaultTasks.value.length)

  // Actions
  // 初始化：检查登录状态
  async function init() {
    if (initialized.value) return

    try {
      const response = await getCurrentUser()
      if (response.data.success && response.data.data.user) {
        user.value = response.data.data.user
        isLoggedIn.value = true
      }
    } catch {
      // 未登录或 Token 过期，不处理
      user.value = null
      isLoggedIn.value = false
    } finally {
      initialized.value = true
    }
  }

  // 登录
  async function login(credentials: LoginData) {
    loading.value = true
    try {
      const response = await loginApi(credentials)
      if (response.data.success) {
        user.value = response.data.data.user
        isLoggedIn.value = true
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '登录失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(data: RegisterData) {
    loading.value = true
    try {
      const response = await registerApi(data)
      if (response.data.success) {
        user.value = response.data.data.user
        isLoggedIn.value = true
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '注册失败'
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    loading.value = true
    try {
      await logoutApi()
    } finally {
      user.value = null
      isLoggedIn.value = false
      router.push('/login')
      loading.value = false
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser() {
    try {
      const response = await getCurrentUser()
      if (response.data.success) {
        user.value = response.data.data.user
        isLoggedIn.value = true
      }
    } catch {
      user.value = null
      isLoggedIn.value = false
    }
  }

  // Default tasks actions
  async function fetchDefaultTasks() {
    defaultTasksLoading.value = true
    try {
      const response = await getDefaultTasks()
      if (response.data.success) {
        defaultTasks.value = response.data.data.defaultTasks
      }
    } catch (error: any) {
      ElMessage.error(error.message || '获取默认任务失败')
    } finally {
      defaultTasksLoading.value = false
    }
  }

  async function addDefaultTask(data: CreateDefaultTaskData) {
    try {
      const response = await createDefaultTask(data)
      if (response.data.success) {
        defaultTasks.value.push(response.data.data.task)
        ElMessage.success('添加成功')
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '添加失败'
      ElMessage.error(message)
      return { success: false, message }
    }
  }

  async function updateDefaultTaskById(id: number, data: Partial<CreateDefaultTaskData>) {
    try {
      const response = await updateDefaultTask(id, data)
      if (response.data.success) {
        const index = defaultTasks.value.findIndex(task => task.id === id)
        if (index !== -1) {
          defaultTasks.value[index] = response.data.data.task
        }
        ElMessage.success('更新成功')
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '更新失败'
      ElMessage.error(message)
      return { success: false, message }
    }
  }

  async function removeDefaultTask(id: number) {
    try {
      const response = await deleteDefaultTask(id)
      if (response.data.success) {
        defaultTasks.value = defaultTasks.value.filter(task => task.id !== id)
        ElMessage.success('删除成功')
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || '删除失败'
      ElMessage.error(message)
      return { success: false, message }
    }
  }

  return {
    user,
    isLoggedIn,
    loading,
    initialized,
    isAuthenticated,
    defaultTasks,
    defaultTasksLoading,
    defaultTasksCount,
    init,
    login,
    register,
    logout,
    fetchCurrentUser,
    fetchDefaultTasks,
    addDefaultTask,
    updateDefaultTaskById,
    removeDefaultTask,
  }
})
