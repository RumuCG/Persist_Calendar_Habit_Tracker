<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores'

const userStore = useUserStore()

onMounted(() => {
  userStore.init()
})
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式在 styles/index.css 中定义 */
</style>
