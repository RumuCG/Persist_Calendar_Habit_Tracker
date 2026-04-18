import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPlans, getPlanById, createPlan, updatePlan, deletePlan, toggleComplete,
  getDefaultTasks, createDefaultTask, updateDefaultTask, deleteDefaultTask
} from '@/api/plan'
import request from '@/api/request'

vi.mock('@/api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('Plan API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPlans', () => {
    it('should fetch plans with date range', async () => {
      const mockParams = { startDate: '2024-01-01', endDate: '2024-01-31' }
      const mockResponse = {
        data: {
          success: true,
          data: {
            plans: [
              { id: 1, title: 'Test Plan', date: '2024-01-15', isCompleted: false },
            ],
          },
        },
      }
      vi.mocked(request.get).mockResolvedValueOnce(mockResponse)

      const result = await getPlans(mockParams)

      expect(request.get).toHaveBeenCalledWith('/plans', { params: mockParams })
      expect(result.data.success).toBe(true)
      expect(result.data.data.plans).toHaveLength(1)
    })

    it('should fetch all plans without params', async () => {
      const mockResponse = {
        data: { success: true, data: { plans: [] } },
      }
      vi.mocked(request.get).mockResolvedValueOnce(mockResponse)

      const result = await getPlans()

      expect(request.get).toHaveBeenCalledWith('/plans', { params: undefined })
      expect(result.data.success).toBe(true)
    })
  })

  describe('getPlanById', () => {
    it('should fetch single plan by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { plan: { id: 1, title: 'Test Plan', date: '2024-01-15' } },
        },
      }
      vi.mocked(request.get).mockResolvedValueOnce(mockResponse)

      const result = await getPlanById(1)

      expect(request.get).toHaveBeenCalledWith('/plans/1')
      expect(result.data.success).toBe(true)
    })
  })

  describe('createPlan', () => {
    it('should create new plan', async () => {
      const mockData = { title: 'New Plan', date: '2024-01-20' }
      const mockResponse = {
        data: {
          success: true,
          data: { plan: { id: 1, ...mockData } },
          message: '创建成功',
        },
      }
      vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

      const result = await createPlan(mockData)

      expect(request.post).toHaveBeenCalledWith('/plans', mockData)
      expect(result.data.success).toBe(true)
    })
  })

  describe('updatePlan', () => {
    it('should update existing plan', async () => {
      const mockData = { title: 'Updated Plan' }
      const mockResponse = {
        data: {
          success: true,
          data: { plan: { id: 1, ...mockData } },
          message: '更新成功',
        },
      }
      vi.mocked(request.put).mockResolvedValueOnce(mockResponse)

      const result = await updatePlan(1, mockData)

      expect(request.put).toHaveBeenCalledWith('/plans/1', mockData)
      expect(result.data.success).toBe(true)
    })
  })

  describe('deletePlan', () => {
    it('should delete plan', async () => {
      const mockResponse = {
        data: { success: true, message: '删除成功' },
      }
      vi.mocked(request.delete).mockResolvedValueOnce(mockResponse)

      const result = await deletePlan(1)

      expect(request.delete).toHaveBeenCalledWith('/plans/1')
      expect(result.data.success).toBe(true)
    })
  })

  describe('toggleComplete', () => {
    it('should toggle plan completion status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { plan: { id: 1, isCompleted: true } },
          message: '更新成功',
        },
      }
      vi.mocked(request.patch).mockResolvedValueOnce(mockResponse)

      const result = await toggleComplete(1, true)

      expect(request.patch).toHaveBeenCalledWith('/plans/1/complete', { isCompleted: true })
      expect(result.data.success).toBe(true)
    })
  })

  describe('Default Tasks API', () => {
    describe('getDefaultTasks', () => {
      it('should fetch all default tasks', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: {
              defaultTasks: [
                { id: 1, title: '晨跑', description: '每天5公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
                { id: 2, title: '阅读', description: '阅读30分钟', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
              ],
            },
          },
        }
        vi.mocked(request.get).mockResolvedValueOnce(mockResponse)

        const result = await getDefaultTasks()

        expect(request.get).toHaveBeenCalledWith('/plans/default')
        expect(result.data.success).toBe(true)
        expect(result.data.data.defaultTasks).toHaveLength(2)
        expect(result.data.data.defaultTasks[0].title).toBe('晨跑')
      })

      it('should return empty array when no default tasks', async () => {
        const mockResponse = {
          data: {
            success: true,
            data: { defaultTasks: [] },
          },
        }
        vi.mocked(request.get).mockResolvedValueOnce(mockResponse)

        const result = await getDefaultTasks()

        expect(result.data.data.defaultTasks).toHaveLength(0)
      })
    })

    describe('createDefaultTask', () => {
      it('should create a new default task', async () => {
        const mockData = { title: '冥想', description: '每天冥想10分钟' }
        const mockResponse = {
          data: {
            success: true,
            data: {
              task: { id: 1, ...mockData, isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            },
            message: '创建成功',
          },
        }
        vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

        const result = await createDefaultTask(mockData)

        expect(request.post).toHaveBeenCalledWith('/plans/default', mockData)
        expect(result.data.success).toBe(true)
        expect(result.data.data.task.title).toBe('冥想')
      })

      it('should create default task without description', async () => {
        const mockData = { title: '早起' }
        const mockResponse = {
          data: {
            success: true,
            data: {
              task: { id: 1, title: '早起', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            },
            message: '创建成功',
          },
        }
        vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

        const result = await createDefaultTask(mockData)

        expect(request.post).toHaveBeenCalledWith('/plans/default', mockData)
        expect(result.data.success).toBe(true)
      })
    })

    describe('updateDefaultTask', () => {
      it('should update default task title', async () => {
        const mockData = { title: '夜跑' }
        const mockResponse = {
          data: {
            success: true,
            data: {
              task: { id: 1, title: '夜跑', description: '每天5公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' },
            },
            message: '更新成功',
          },
        }
        vi.mocked(request.put).mockResolvedValueOnce(mockResponse)

        const result = await updateDefaultTask(1, mockData)

        expect(request.put).toHaveBeenCalledWith('/plans/default/1', mockData)
        expect(result.data.success).toBe(true)
        expect(result.data.data.task.title).toBe('夜跑')
      })

      it('should update default task description', async () => {
        const mockData = { description: '每天晚上跑步3公里' }
        const mockResponse = {
          data: {
            success: true,
            data: {
              task: { id: 1, title: '跑步', description: '每天晚上跑步3公里', isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' },
            },
            message: '更新成功',
          },
        }
        vi.mocked(request.put).mockResolvedValueOnce(mockResponse)

        const result = await updateDefaultTask(1, mockData)

        expect(request.put).toHaveBeenCalledWith('/plans/default/1', mockData)
        expect(result.data.data.task.description).toBe('每天晚上跑步3公里')
      })

      it('should update both title and description', async () => {
        const mockData = { title: '健身', description: '每天健身1小时' }
        const mockResponse = {
          data: {
            success: true,
            data: {
              task: { id: 1, ...mockData, isCompleted: false, createdAt: '2024-01-01', updatedAt: '2024-01-02' },
            },
            message: '更新成功',
          },
        }
        vi.mocked(request.put).mockResolvedValueOnce(mockResponse)

        const result = await updateDefaultTask(1, mockData)

        expect(result.data.data.task.title).toBe('健身')
        expect(result.data.data.task.description).toBe('每天健身1小时')
      })
    })

    describe('deleteDefaultTask', () => {
      it('should delete default task', async () => {
        const mockResponse = {
          data: {
            success: true,
            message: '删除成功',
          },
        }
        vi.mocked(request.delete).mockResolvedValueOnce(mockResponse)

        const result = await deleteDefaultTask(1)

        expect(request.delete).toHaveBeenCalledWith('/plans/default/1')
        expect(result.data.success).toBe(true)
        expect(result.data.message).toBe('删除成功')
      })

      it('should handle deletion of non-existent task', async () => {
        const mockResponse = {
          data: {
            success: false,
            message: '任务不存在',
          },
        }
        vi.mocked(request.delete).mockResolvedValueOnce(mockResponse)

        const result = await deleteDefaultTask(999)

        expect(request.delete).toHaveBeenCalledWith('/plans/default/999')
        expect(result.data.success).toBe(false)
      })
    })
  })
})
