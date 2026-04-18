import request from './request'

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface User {
  id: number
  username: string
  email: string
}

export interface AuthResponse {
  user: User
}

// 用户注册
export function register(data: RegisterData) {
  return request.post<{
    success: boolean
    data: AuthResponse
    message: string
  }>('/auth/register', data)
}

// 用户登录
export function login(data: LoginData) {
  return request.post<{
    success: boolean
    data: AuthResponse
    message: string
  }>('/auth/login', data)
}

// 用户登出
export function logout() {
  return request.post<{
    success: boolean
    message: string
  }>('/auth/logout')
}

// 获取当前用户
export function getCurrentUser() {
  return request.get<{
    success: boolean
    data: { user: User }
  }>('/auth/me')
}

// 刷新 Token
export function refreshToken() {
  return request.post<{
    success: boolean
    data: { token: string }
    message: string
  }>('/auth/refresh')
}
