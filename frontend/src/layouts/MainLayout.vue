<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { User, Trophy, Star, List, Timer } from '@element-plus/icons-vue'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const isHome = computed(() => route.path === '/')

const goToProfile = () => router.push('/profile')
const goToLeaderboard = () => router.push('/leaderboard')
const goToDefaultTasks = () => router.push('/default-tasks')
const goToFocus = () => router.push('/focus')
const goToHome = () => router.push('/')
</script>

<template>
  <div class="main-layout">
    <!-- Header with PERSIST Logo -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="logo" @click="goToHome">
          <span class="logo-icon">✦</span>
          PERSIST
        </h1>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <div class="nav-item-wrapper">
        <button
          class="nav-item"
          :class="{ active: route.path === '/profile' }"
          @click="goToProfile"
        >
          <div class="nav-icon">
            <User />
          </div>
          <span class="nav-label">个人中心</span>
        </button>
      </div>

      <div class="nav-item-wrapper">
        <button
          class="nav-item"
          :class="{ active: isHome }"
          @click="goToHome"
        >
          <div class="nav-icon">
            <List />
          </div>
          <span class="nav-label">任务管理</span>
        </button>
      </div>

      <div class="nav-item-wrapper">
        <button
          class="nav-item"
          :class="{ active: route.path === '/leaderboard' }"
          @click="goToLeaderboard"
        >
          <div class="nav-icon">
            <Trophy />
          </div>
          <span class="nav-label">排行榜</span>
        </button>
      </div>

      <div class="nav-item-wrapper">
        <button
          class="nav-item"
          :class="{ active: route.path === '/focus' }"
          @click="goToFocus"
        >
          <div class="nav-icon">
            <Timer />
          </div>
          <span class="nav-label">专注</span>
        </button>
      </div>

      <div class="nav-item-wrapper">
        <button
          class="nav-item"
          :class="{ active: route.path === '/default-tasks' }"
          @click="goToDefaultTasks"
        >
          <div class="nav-icon">
            <Star />
          </div>
          <span class="nav-label">默认任务</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #ffe4e6 100%);
  background-attachment: fixed;
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-primary-lighter);
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.logo-icon {
  font-size: 24px;
  animation: pulse 2s ease-in-out infinite;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px 16px 100px;
  overflow: auto;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

/* Bottom Navigation */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--color-primary-lighter);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: flex-end;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
  width: 100%;
  height: 70px;
  box-sizing: border-box;
}

.nav-item-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  width: 100%;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s var(--transition-spring);
  color: var(--text-tertiary);
  width: 100%;
  height: auto;
  position: relative;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item:active {
  transform: scale(0.92);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s var(--transition-spring);
}

.nav-icon svg {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  transition: all 0.3s var(--transition-spring);
}

.nav-item.active .nav-icon {
  transform: translateY(-2px);
}

.nav-item.active .nav-label {
  font-weight: 700;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  width: 20px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 2px;
  transition: all 0.3s var(--transition-spring);
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .main-content {
    padding: 16px 16px 100px;
  }

  .app-header {
    padding: 10px 16px;
  }

  .logo {
    font-size: 18px;
  }

  .logo-icon {
    font-size: 20px;
  }
}

/* Desktop - Center the layout */
@media (min-width: 769px) {
  .main-layout {
    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #ffe4e6 100%);
  }

  .app-header {
    border-radius: 0;
  }
}
</style>
