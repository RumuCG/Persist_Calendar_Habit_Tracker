import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import * as planApi from '@/api/plan'

// Mock API
vi.mock('@/api/plan', () => ({
  getDefaultTasks: vi.fn(),
  createDefaultTask: vi.fn(),
  updateDefaultTask: vi.fn(),
  deleteDefaultTask: vi.fn(),
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('Default Tasks Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Store and API Integration', () => {
    it('fetches default tasks and updates store state', async () => {
      const mockTasks = [
        { id: 1, title: '晨跑', description: '每天5公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, title: '阅读', description: '阅读30分钟', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
        data: {
          success: true,
          data: { defaultTasks: mockTasks },
        },
      } as any)

      const store = useUserStore()
      await store.fetchDefaultTasks()

      expect(planApi.getDefaultTasks).toHaveBeenCalledTimes(1)
      expect(store.defaultTasks).toHaveLength(2)
      expect(store.defaultTasks[0].title).toBe('晨跑')
      expect(store.defaultTasks[1].title).toBe('阅读')
      expect(store.defaultTasksLoading).toBe(false)
    })

    it('adds new default task and updates store', async () => {
      const newTask = { id: 3, title: '冥想', description: '冥想10分钟', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }

      vi.mocked(planApi.createDefaultTask).mockResolvedValue({
        data: {
          success: true,
          data: { task: newTask },
          message: '创建成功',
        },
      } as any)

      const store = useUserStore()
      store.defaultTasks = [
        { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      const result = await store.addDefaultTask({ title: '冥想', description: '冥想10分钟' })

      expect(planApi.createDefaultTask).toHaveBeenCalledWith({ title: '冥想', description: '冥想10分钟' })
      expect(result.success).toBe(true)
      expect(store.defaultTasks).toHaveLength(2)
      expect(store.defaultTasks[1]).toEqual(newTask)
    })

    it('updates existing default task in store', async () => {
      const updatedTask = { id: 1, title: '夜跑', description: '每天3公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' }

      vi.mocked(planApi.updateDefaultTask).mockResolvedValue({
        data: {
          success: true,
          data: { task: updatedTask },
          message: '更新成功',
        },
      } as any)

      const store = useUserStore()
      store.defaultTasks = [
        { id: 1, title: '晨跑', description: '每天5公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      const result = await store.updateDefaultTaskById(1, { title: '夜跑', description: '每天3公里' })

      expect(planApi.updateDefaultTask).toHaveBeenCalledWith(1, { title: '夜跑', description: '每天3公里' })
      expect(result.success).toBe(true)
      expect(store.defaultTasks[0].title).toBe('夜跑')
      expect(store.defaultTasks[0].description).toBe('每天3公里')
    })

    it('removes default task from store', async () => {
      vi.mocked(planApi.deleteDefaultTask).mockResolvedValue({
        data: {
          success: true,
          message: '删除成功',
        },
      } as any)

      const store = useUserStore()
      store.defaultTasks = [
        { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, title: '阅读', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      const result = await store.removeDefaultTask(1)

      expect(planApi.deleteDefaultTask).toHaveBeenCalledWith(1)
      expect(result.success).toBe(true)
      expect(store.defaultTasks).toHaveLength(1)
      expect(store.defaultTasks[0].id).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('handles API error when fetching default tasks', async () => {
      const { ElMessage } = await import('element-plus')
      vi.mocked(planApi.getDefaultTasks).mockRejectedValue(new Error('Network error'))

      const store = useUserStore()
      await store.fetchDefaultTasks()

      expect(ElMessage.error).toHaveBeenCalledWith('Network error')
      expect(store.defaultTasksLoading).toBe(false)
    })

    it('handles API error when adding default task', async () => {
      const { ElMessage } = await import('element-plus')
      vi.mocked(planApi.createDefaultTask).mockRejectedValue({
        response: { data: { error: { message: '任务名称已存在' } } },
      })

      const store = useUserStore()
      const result = await store.addDefaultTask({ title: '晨跑' })

      expect(result.success).toBe(false)
      expect(result.message).toBe('任务名称已存在')
      expect(ElMessage.error).toHaveBeenCalledWith('任务名称已存在')
    })

    it('handles API error when updating default task', async () => {
      const { ElMessage } = await import('element-plus')
      vi.mocked(planApi.updateDefaultTask).mockRejectedValue({
        response: { data: { error: { message: '任务不存在' } } },
      })

      const store = useUserStore()
      const result = await store.updateDefaultTaskById(999, { title: '新名称' })

      expect(result.success).toBe(false)
      expect(result.message).toBe('任务不存在')
      expect(ElMessage.error).toHaveBeenCalledWith('任务不存在')
    })

    it('handles API error when removing default task', async () => {
      const { ElMessage } = await import('element-plus')
      vi.mocked(planApi.deleteDefaultTask).mockRejectedValue({
        response: { data: { error: { message: '删除失败' } } },
      })

      const store = useUserStore()
      const result = await store.removeDefaultTask(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('删除失败')
      expect(ElMessage.error).toHaveBeenCalledWith('删除失败')
    })
  })

  describe('Store Getters', () => {
    it('calculates defaultTasksCount correctly', () => {
      const store = useUserStore()
      store.defaultTasks = [
        { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, title: '阅读', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 3, title: '冥想', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      expect(store.defaultTasksCount).toBe(3)
    })

    it('returns zero when no default tasks', () => {
      const store = useUserStore()
      store.defaultTasks = []

      expect(store.defaultTasksCount).toBe(0)
    })
  })

  describe('Loading States', () => {
    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(planApi.getDefaultTasks).mockReturnValue(promise as any)

      const store = useUserStore()
      const fetchPromise = store.fetchDefaultTasks()

      expect(store.defaultTasksLoading).toBe(true)

      resolvePromise!({
        data: {
          success: true,
          data: { defaultTasks: [] },
        },
      })

      await fetchPromise
      expect(store.defaultTasksLoading).toBe(false)
    })
  })

  describe('Data Consistency', () => {
    it('maintains task order after updates', async () => {
      vi.mocked(planApi.updateDefaultTask).mockResolvedValue({
        data: {
          success: true,
          data: {
            task: { id: 2, title: 'Updated Reading', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' },
          },
          message: '更新成功',
        },
      } as any)

      const store = useUserStore()
      store.defaultTasks = [
        { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, title: '阅读', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 3, title: '冥想', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      await store.updateDefaultTaskById(2, { title: 'Updated Reading' })

      expect(store.defaultTasks[0].id).toBe(1)
      expect(store.defaultTasks[1].id).toBe(2)
      expect(store.defaultTasks[2].id).toBe(3)
      expect(store.defaultTasks[1].title).toBe('Updated Reading')
    })

    it('handles concurrent operations correctly', async () => {
      vi.mocked(planApi.createDefaultTask).mockResolvedValue({
        data: {
          success: true,
          data: { task: { id: 2, title: 'New Task', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' } },
          message: '创建成功',
        },
      } as any)

      const store = useUserStore()
      store.defaultTasks = [
        { id: 1, title: 'Existing Task', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]

      // Simulate concurrent additions
      await Promise.all([
        store.addDefaultTask({ title: 'Task A' }),
        store.addDefaultTask({ title: 'Task B' }),
      ])

      // Both tasks should be added
      expect(store.defaultTasks.length).toBeGreaterThan(1)
    })
  })
})
