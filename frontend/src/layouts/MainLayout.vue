<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { User, Trophy, Star, Plus } from '@element-plus/icons-vue'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const router = useRouter()

const isHome = computed(() => route.path === '/')

const goToProfile = () => router.push('/profile')
const goToLeaderboard = () => router.push('/leaderboard')
const goToDefaultTasks = () => router.push('/default-tasks')
const goToHome = () => router.push('/')

// Draggable button state
const isDragging = ref(false)
const buttonPos = ref({ x: 0, y: 0 })
const dragStartPos = ref({ x: 0, y: 0 })
const touchStartPos = ref({ x: 0, y: 0 })
const centerButtonRef = ref<HTMLElement | null>(null)

// Get the center position of the nav container
const getCenterPosition = () => {
  const nav = document.querySelector('.bottom-nav')
  if (!nav) return { x: 0, y: 0 }
  const rect = nav.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2 - 28, // 28 is half of button width (56px)
    y: rect.top - 12 // slightly above nav
  }
}

// Mouse/Touch event handlers for dragging
const hasMoved = ref(false)
const DRAG_THRESHOLD = 5 // pixels

const handleDragStart = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true
  hasMoved.value = false
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  touchStartPos.value = { x: clientX, y: clientY }
  dragStartPos.value = { ...buttonPos.value }

  if (centerButtonRef.value) {
    centerButtonRef.value.style.transition = 'none'
  }
}

const handleDragMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  e.preventDefault()

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  const deltaX = clientX - touchStartPos.value.x
  const deltaY = clientY - touchStartPos.value.y

  // Check if moved beyond threshold
  if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
    hasMoved.value = true
  }

  buttonPos.value = {
    x: dragStartPos.value.x + deltaX,
    y: dragStartPos.value.y + deltaY
  }
}

const handleDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false

  // Animate back to center position
  const centerPos = getCenterPosition()
  buttonPos.value = centerPos

  if (centerButtonRef.value) {
    centerButtonRef.value.style.transition = 'left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), top 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
}

onMounted(() => {
  // Initialize button position
  const updatePosition = () => {
    const centerPos = getCenterPosition()
    buttonPos.value = centerPos
  }

  // Set initial position
  setTimeout(updatePosition, 100)

  // Update on resize
  window.addEventListener('resize', updatePosition)

  // Global move/up handlers
  const handleGlobalMove = (e: MouseEvent | TouchEvent) => handleDragMove(e)
  const handleGlobalEnd = () => handleDragEnd()

  document.addEventListener('mousemove', handleGlobalMove)
  document.addEventListener('mouseup', handleGlobalEnd)
  document.addEventListener('touchmove', handleGlobalMove, { passive: false })
  document.addEventListener('touchend', handleGlobalEnd)

  onUnmounted(() => {
    window.removeEventListener('resize', updatePosition)
    document.removeEventListener('mousemove', handleGlobalMove)
    document.removeEventListener('mouseup', handleGlobalEnd)
    document.removeEventListener('touchmove', handleGlobalMove)
    document.removeEventListener('touchend', handleGlobalEnd)
  })
})
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

      <div class="nav-item-wrapper center-wrapper">
        <!-- Draggable floating button -->
        <div
          ref="centerButtonRef"
          class="nav-item-center"
          :class="{ active: isHome, dragging: isDragging }"
          :style="{
            left: `${buttonPos.x}px`,
            top: `${buttonPos.y}px`,
            transform: isDragging ? 'scale(1.1)' : 'scale(1)'
          }"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
          @click="!hasMoved && goToHome()"
        >
          <div class="nav-icon-center">
            <Plus />
          </div>
          <span class="nav-label">今日任务</span>
        </div>
        <!-- Placeholder to maintain grid layout -->
        <div class="nav-item-placeholder"></div>
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
  max-width: 480px;
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
  grid-template-columns: repeat(4, 1fr);
  align-items: flex-end;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
  max-width: 480px;
  margin: 0 auto;
  left: 50%;
  transform: translateX(-50%);
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
  transition: all 0.3s ease;
  color: var(--text-tertiary);
  width: 100%;
  height: auto;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.nav-icon svg {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.nav-item.active .nav-icon {
  transform: translateY(-2px);
}

.nav-item.active .nav-label {
  font-weight: 700;
}

/* Center Wrapper */
.center-wrapper {
  position: static;
}

.nav-item-placeholder {
  height: 50px;
  width: 100%;
}

/* Center Button (Home) - Draggable floating button */
.nav-item-center {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: 1001;
  left: 0;
  top: 0;
  will-change: left, top;
}

.nav-item-center:active {
  cursor: grabbing;
}

.nav-item-center.dragging .nav-icon-center {
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.6);
}

.nav-icon-center {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.4);
  transition: box-shadow 0.2s ease;
  pointer-events: none;
}

.nav-icon-center svg {
  width: 28px;
  height: 28px;
  color: white;
}

.nav-item-center.active .nav-icon-center {
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5);
}

.nav-item-center .nav-label {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  transition: all 0.3s ease;
  pointer-events: none;
}

.nav-item-center.active .nav-label {
  color: var(--color-primary);
  font-weight: 700;
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
