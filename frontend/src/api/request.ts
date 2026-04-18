import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true, // 自动携带 Cookie
})

// 请求队列（用于 Token 刷新时暂存请求）
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

// 订阅 Token 刷新
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

// 通知所有订阅者
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 请求发送前的处理
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 统一处理响应数据
    const { data } = response
    if (data.success === false) {
      ElMessage.error(data.error?.message || '操作失败')
      return Promise.reject(new Error(data.error?.message || '操作失败'))
    }
    return response
  },
  async (error: AxiosError) => {
    const { response, config } = error

    if (!response) {
      ElMessage.error('网络错误，请检查网络连接')
      return Promise.reject(error)
    }

    const { status, data } = response as { status: number; data: any }

    // Token 过期，尝试刷新
    if (status === 401 && config && !(config as any).__retry) {
      if (!isRefreshing) {
        isRefreshing = true
        ;(config as any).__retry = true

        try {
          // 调用刷新 Token 接口
          const refreshResponse = await axios.post(
            '/api/auth/refresh',
            {},
            { withCredentials: true }
          )

          if (refreshResponse.data.success) {
            onTokenRefreshed(refreshResponse.data.data?.token || '')
            isRefreshing = false
            // 重试原请求
            return request(config)
          } else {
            throw new Error('刷新 Token 失败')
          }
        } catch (refreshError) {
          isRefreshing = false
          refreshSubscribers = []
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
          return Promise.reject(refreshError)
        }
      } else {
        // 正在刷新 Token，将请求加入队列
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(request(config))
          })
        })
      }
    }

    // 其他错误处理
    const errorMessage = data?.error?.message || '请求失败'
    ElMessage.error(errorMessage)

    // 未授权且不是 Token 过期，跳转登录页
    if (status === 401) {
      router.push('/login')
    }

    return Promise.reject(error)
  }
)

export default request
