<template>
  <div class="theme-toggle" :class="{ 'dark-mode': isDarkMode }">
    <button @click="toggleTheme" class="toggle-btn">
      <span class="icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
      <span class="label">{{ isDarkMode ? '日间模式' : '夜间模式' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isDarkMode = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark-mode')
  }
})

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    localStorage.setItem('theme', 'dark')
    document.documentElement.classList.add('dark-mode')
  } else {
    localStorage.setItem('theme', 'light')
    document.documentElement.classList.remove('dark-mode')
  }
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDarkMode: isDarkMode.value } }))
}
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  backdrop-filter: blur(10px);
}

.toggle-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.icon {
  font-size: 20px;
}

.label {
  font-size: 14px;
}

.dark-mode .toggle-btn {
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.9) 0%, rgba(52, 146, 104, 0.9) 100%);
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.3);
}

.dark-mode .toggle-btn:hover {
  box-shadow: 0 8px 24px rgba(66, 184, 131, 0.4);
}
</style>
