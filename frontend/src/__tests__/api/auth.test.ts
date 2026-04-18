import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register, login, logout, getCurrentUser, refreshToken } from '@/api/auth'
import request from '@/api/request'

// Mock request module
vi.mock('@/api/request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should call register API with correct data', async () => {
      const mockData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123456',
      }
      const mockResponse = {
        data: {
          success: true,
          data: { user: { id: 1, username: 'testuser', email: 'test@example.com' } },
          message: '注册成功',
        },
      }
      vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

      const result = await register(mockData)

      expect(request.post).toHaveBeenCalledWith('/auth/register', mockData)
      expect(result.data.success).toBe(true)
    })
  })

  describe('login', () => {
    it('should call login API with correct credentials', async () => {
      const mockData = {
        email: 'test@example.com',
        password: 'Test123456',
      }
      const mockResponse = {
        data: {
          success: true,
          data: { user: { id: 1, username: 'testuser', email: 'test@example.com' } },
          message: '登录成功',
        },
      }
      vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

      const result = await login(mockData)

      expect(request.post).toHaveBeenCalledWith('/auth/login', mockData)
      expect(result.data.success).toBe(true)
    })
  })

  describe('logout', () => {
    it('should call logout API', async () => {
      const mockResponse = {
        data: { success: true, message: '登出成功' },
      }
      vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

      const result = await logout()

      expect(request.post).toHaveBeenCalledWith('/auth/logout')
      expect(result.data.success).toBe(true)
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch current user info', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { user: { id: 1, username: 'testuser', email: 'test@example.com' } },
        },
      }
      vi.mocked(request.get).mockResolvedValueOnce(mockResponse)

      const result = await getCurrentUser()

      expect(request.get).toHaveBeenCalledWith('/auth/me')
      expect(result.data.success).toBe(true)
    })
  })

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockResponse = {
        data: { success: true, data: { token: 'new-token' }, message: '刷新成功' },
      }
      vi.mocked(request.post).mockResolvedValueOnce(mockResponse)

      const result = await refreshToken()

      expect(request.post).toHaveBeenCalledWith('/auth/refresh')
      expect(result.data.success).toBe(true)
    })
  })
})
