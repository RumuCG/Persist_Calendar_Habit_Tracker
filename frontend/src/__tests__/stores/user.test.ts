import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import * as authApi from '@/api/auth'
import * as planApi from '@/api/plan'

// Mock API
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('@/api/plan', () => ({
  getDefaultTasks: vi.fn(),
  createDefaultTask: vi.fn(),
  updateDefaultTask: vi.fn(),
  deleteDefaultTask: vi.fn(),
}))

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}))

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useUserStore()

      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.initialized).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should have correct default tasks initial state', () => {
      const store = useUserStore()

      expect(store.defaultTasks).toEqual([])
      expect(store.defaultTasksLoading).toBe(false)
      expect(store.defaultTasksCount).toBe(0)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const store = useUserStore()
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      const mockResponse = {
        data: {
          success: true,
          data: { user: mockUser },
        },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)

      const result = await store.login({ email: 'test@example.com', password: 'password' })

      expect(result.success).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.isLoggedIn).toBe(true)
      expect(store.isAuthenticated).toBe(true)
    })

    it('should handle login failure', async () => {
      const store = useUserStore()
      const mockError = {
        response: { data: { error: { message: 'Invalid credentials' } } },
      }
      vi.mocked(authApi.login).mockRejectedValue(mockError)

      const result = await store.login({ email: 'test@example.com', password: 'wrong' })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid credentials')
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const store = useUserStore()
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      const mockResponse = {
        data: {
          success: true,
          data: { user: mockUser },
        },
      }
      vi.mocked(authApi.register).mockResolvedValue(mockResponse as any)

      const result = await store.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
      })

      expect(result.success).toBe(true)
      expect(store.user).toEqual(mockUser)
      expect(store.isLoggedIn).toBe(true)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const store = useUserStore()
      store.user = { id: 1, username: 'testuser', email: 'test@example.com' }
      store.isLoggedIn = true

      vi.mocked(authApi.logout).mockResolvedValue({ data: { success: true } } as any)

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('init', () => {
    it('should initialize user state when authenticated', async () => {
      const store = useUserStore()
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      const mockResponse = {
        data: {
          success: true,
          data: { user: mockUser },
        },
      }
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockResponse as any)

      await store.init()

      expect(store.user).toEqual(mockUser)
      expect(store.isLoggedIn).toBe(true)
      expect(store.initialized).toBe(true)
    })

    it('should handle unauthenticated state', async () => {
      const store = useUserStore()
      vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Unauthorized'))

      await store.init()

      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(store.initialized).toBe(true)
    })

    it('should not reinitialize if already initialized', async () => {
      const store = useUserStore()
      store.initialized = true

      await store.init()

      expect(authApi.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('fetchCurrentUser', () => {
    it('should fetch and update user info', async () => {
      const store = useUserStore()
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' }
      const mockResponse = {
        data: {
          success: true,
          data: { user: mockUser },
        },
      }
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockResponse as any)

      await store.fetchCurrentUser()

      expect(store.user).toEqual(mockUser)
      expect(store.isLoggedIn).toBe(true)
    })
  })

  describe('default tasks actions', () => {
    describe('fetchDefaultTasks', () => {
      it('should fetch and store default tasks', async () => {
        const store = useUserStore()
        const mockTasks = [
          { id: 1, title: '晨跑', description: '每天5公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 2, title: '阅读', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]
        vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
          data: { success: true, data: { defaultTasks: mockTasks } },
        } as any)

        await store.fetchDefaultTasks()

        expect(planApi.getDefaultTasks).toHaveBeenCalled()
        expect(store.defaultTasks).toEqual(mockTasks)
        expect(store.defaultTasksCount).toBe(2)
        expect(store.defaultTasksLoading).toBe(false)
      })

      it('should handle empty default tasks', async () => {
        const store = useUserStore()
        vi.mocked(planApi.getDefaultTasks).mockResolvedValue({
          data: { success: true, data: { defaultTasks: [] } },
        } as any)

        await store.fetchDefaultTasks()

        expect(store.defaultTasks).toEqual([])
        expect(store.defaultTasksCount).toBe(0)
      })
    })

    describe('addDefaultTask', () => {
      it('should add new default task to store', async () => {
        const store = useUserStore()
        const newTask = { id: 1, title: '冥想', description: '每天10分钟', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' }
        vi.mocked(planApi.createDefaultTask).mockResolvedValue({
          data: { success: true, data: { task: newTask }, message: '创建成功' },
        } as any)

        const result = await store.addDefaultTask({ title: '冥想', description: '每天10分钟' })

        expect(result.success).toBe(true)
        expect(store.defaultTasks).toHaveLength(1)
        expect(store.defaultTasks[0]).toEqual(newTask)
      })

      it('should handle add failure', async () => {
        const store = useUserStore()
        vi.mocked(planApi.createDefaultTask).mockRejectedValue({
          response: { data: { error: { message: '创建失败' } } },
        })

        const result = await store.addDefaultTask({ title: '冥想' })

        expect(result.success).toBe(false)
        expect(result.message).toBe('创建失败')
        expect(store.defaultTasks).toHaveLength(0)
      })
    })

    describe('updateDefaultTaskById', () => {
      it('should update existing task in store', async () => {
        const store = useUserStore()
        store.defaultTasks = [
          { id: 1, title: '晨跑', description: '5公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]
        const updatedTask = { id: 1, title: '夜跑', description: '3公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' }
        vi.mocked(planApi.updateDefaultTask).mockResolvedValue({
          data: { success: true, data: { task: updatedTask }, message: '更新成功' },
        } as any)

        const result = await store.updateDefaultTaskById(1, { title: '夜跑', description: '3公里' })

        expect(result.success).toBe(true)
        expect(store.defaultTasks[0].title).toBe('夜跑')
        expect(store.defaultTasks[0].description).toBe('3公里')
      })

      it('should not update store when task not found', async () => {
        const store = useUserStore()
        store.defaultTasks = [
          { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]
        const updatedTask = { id: 999, title: '不存在', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' }
        vi.mocked(planApi.updateDefaultTask).mockResolvedValue({
          data: { success: true, data: { task: updatedTask }, message: '更新成功' },
        } as any)

        await store.updateDefaultTaskById(999, { title: '不存在' })

        // Store should remain unchanged
        expect(store.defaultTasks[0].title).toBe('晨跑')
      })
    })

    describe('removeDefaultTask', () => {
      it('should remove task from store', async () => {
        const store = useUserStore()
        store.defaultTasks = [
          { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 2, title: '阅读', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]
        vi.mocked(planApi.deleteDefaultTask).mockResolvedValue({
          data: { success: true, message: '删除成功' },
        } as any)

        const result = await store.removeDefaultTask(1)

        expect(result.success).toBe(true)
        expect(store.defaultTasks).toHaveLength(1)
        expect(store.defaultTasks[0].id).toBe(2)
      })

      it('should handle remove failure', async () => {
        const store = useUserStore()
        store.defaultTasks = [
          { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]
        vi.mocked(planApi.deleteDefaultTask).mockRejectedValue({
          response: { data: { error: { message: '删除失败' } } },
        })

        const result = await store.removeDefaultTask(1)

        expect(result.success).toBe(false)
        expect(store.defaultTasks).toHaveLength(1) // Task should still be in store
      })
    })

    describe('defaultTasksCount getter', () => {
      it('should return correct count', () => {
        const store = useUserStore()
        store.defaultTasks = [
          { id: 1, title: '晨跑', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 2, title: '阅读', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 3, title: '冥想', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]

        expect(store.defaultTasksCount).toBe(3)
      })

      it('should return 0 for empty tasks', () => {
        const store = useUserStore()
        store.defaultTasks = []

        expect(store.defaultTasksCount).toBe(0)
      })
    })
  })
})
