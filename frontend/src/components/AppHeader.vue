<script setup lang="ts">
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { SwitchButton } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  await userStore.logout()
}

const goToHome = () => router.push('/')
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo" @click="goToHome">
        <div class="logo-icon">
          <span class="logo-icon-text">✦</span>
        </div>
        <span class="logo-text">PERSIST</span>
      </div>
    </div>

    <div class="header-right">
      <button
        v-if="userStore.isAuthenticated"
        class="logout-btn"
        @click="handleLogout"
        aria-label="退出登录"
      >
        <SwitchButton />
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-primary-lighter);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-icon-text {
  font-size: 20px;
  animation: pulse 2s ease-in-out infinite;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Logout Button */
.header-right {
  display: flex;
  align-items: center;
}

.logout-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--color-gray-100);
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  background: var(--color-danger);
  color: white;
  transform: scale(1.05);
}

.logout-btn svg {
  width: 20px;
  height: 20px;
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
  .app-header {
    padding: 0 16px;
    height: 56px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-icon-text {
    font-size: 16px;
  }

  .logo-text {
    font-size: 20px;
  }

  .logout-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 12px;
  }

  .logo-text {
    font-size: 18px;
  }
}
</style>
