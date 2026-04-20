import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'DailyTasks',
          component: () => import('@/views/DailyTaskView.vue'),
        },
        {
          path: 'calendar',
          name: 'Calendar',
          component: () => import('@/views/CalendarView.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'leaderboard',
          name: 'Leaderboard',
          component: () => import('@/views/LeaderboardView.vue'),
        },
        {
          path: 'default-tasks',
          name: 'DefaultTasks',
          component: () => import('@/views/DefaultTasksView.vue'),
        },
        {
          path: 'focus',
          name: 'Focus',
          component: () => import('@/views/FocusView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/',
    },
  ],
})

// 导航守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // 初始化用户状态（如果尚未初始化）
  if (!userStore.initialized) {
    await userStore.init()
  }

  const isAuthenticated = userStore.isAuthenticated
  const requiresAuth = to.meta.requiresAuth
  const isPublic = to.meta.public

  // 需要认证但未登录，重定向到登录页
  if (requiresAuth && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }

  // 已登录用户访问公开页面（如登录页），重定向到首页
  if (isPublic && isAuthenticated) {
    const redirect = to.query.redirect as string
    next(redirect || '/')
    return
  }

  next()
})

export default router
