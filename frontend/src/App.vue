<template>
  <AppLayout>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'

onMounted(() => {
  checkLoginStatus()
})

const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token
  console.log('登录状态:', isLoggedIn)
}
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
  transition: background-color 0.3s ease, color 0.3s ease;
}

body.dark-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dark-mode ::-webkit-scrollbar-track {
  background: #2a2a2a;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dark-mode ::-webkit-scrollbar-thumb {
  background: #444;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
