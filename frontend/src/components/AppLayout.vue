<template>
  <div class="app-layout" :class="{ 'dark-mode': isDarkMode }">
    <AnimatedBackground :type="isDarkMode ? 'river' : 'meteor'" />
    <ThemeToggle />
    
    <!-- 移动端菜单按钮 -->
    <button class="mobile-menu-btn" @click="toggleMobileMenu">
      <span>{{ mobileMenuOpen ? '✕' : '☰' }}</span>
    </button>
    
    <!-- 移动端遮罩层 -->
    <div class="mobile-overlay" :class="{ 'show': mobileMenuOpen }" @click="closeMobileMenu"></div>
    
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'open': mobileMenuOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon">🎵</span>
          <span class="logo-text">曼波音乐</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" active-class="active">
          <span class="nav-icon">🏠</span>
          <span class="nav-text">首页</span>
        </router-link>
        <router-link to="/playlist" class="nav-item" active-class="active">
          <span class="nav-icon">📋</span>
          <span class="nav-text">我的歌单</span>
        </router-link>
        <router-link to="/history" class="nav-item" active-class="active">
          <span class="nav-icon">🕐</span>
          <span class="nav-text">收听历史</span>
        </router-link>
        <router-link to="/upload" class="nav-item" active-class="active">
          <span class="nav-icon">📁</span>
          <span class="nav-text">上传音乐</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div v-if="isLoggedIn" class="user-info">
          <div class="user-avatar" @click="showAvatarModal = true">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName">
            <span v-else>👤</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ userName }}</span>
            <span class="user-status">在线</span>
          </div>
        </div>
        <div v-else class="auth-buttons">
          <button @click="showLoginModal = true" class="login-btn">
            <span>🔐</span>
            <span>登录</span>
          </button>
        </div>
        <button v-if="isLoggedIn" @click="logout" class="logout-btn">
          <span>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="content-wrapper">
        <slot></slot>
      </div>
    </main>
    
    <!-- 底部播放器栏 -->
    <div class="bottom-player" v-if="currentSong">
      <div class="player-info">
        <img :src="currentSong.cover" :alt="currentSong.title" class="player-cover">
        <div class="player-details">
          <h4 class="player-title">{{ currentSong.title }}</h4>
          <p class="player-artist">{{ currentSong.artist }}</p>
        </div>
        <button @click="toggleLike" class="like-btn" :class="{ 'liked': isLiked }">
          <span>{{ isLiked ? '❤️' : '🤍' }}</span>
        </button>
      </div>
      
      <div class="player-controls">
        <button @click="playPrevious" class="control-btn">
          <span>⏮</span>
        </button>
        <button @click="togglePlay" class="control-btn play-btn">
          <span>{{ isPlaying ? '⏸' : '▶' }}</span>
        </button>
        <button @click="playNext" class="control-btn">
          <span>⏭</span>
        </button>
        <button @click="togglePlayMode" class="control-btn mode-btn" :title="playModeText">
          <span>{{ playModeIcon }}</span>
        </button>
      </div>
      
      <div class="player-progress">
        <span class="time">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <span class="time">{{ formatTime(duration) }}</span>
      </div>
      
      <div class="player-volume">
        <button @click="toggleMute" class="volume-btn">
          <span>{{ isMuted ? '🔇' : '🔊' }}</span>
        </button>
        <input 
          type="range" 
          v-model="volume" 
          min="0" 
          max="100" 
          @input="updateVolume"
          class="volume-slider"
        >
        <button @click="togglePlaylist" class="playlist-btn">
          <span>📋</span>
        </button>
        <button @click="showLyrics" class="lyrics-btn">
          <span>📝</span>
        </button>
      </div>
    </div>
    
    <!-- 登录弹窗 -->
    <transition name="modal">
      <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>🔐 登录</h3>
            <button @click="showLoginModal = false" class="close-btn">✕</button>
          </div>
          <div class="login-form">
            <div class="form-group">
              <label>用户名</label>
              <input 
                v-model="loginUsername" 
                type="text" 
                placeholder="请输入用户名"
                class="form-input"
                @keydown.enter="handleLogin"
              >
            </div>
            <div class="form-group">
              <label>密码</label>
              <input 
                v-model="loginPassword" 
                type="password" 
                placeholder="请输入密码"
                class="form-input"
                @keydown.enter="handleLogin"
              >
            </div>
            <button @click="handleLogin" class="login-submit-btn">
              <span>🔑</span>
              <span>登录</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 头像编辑弹窗 -->
    <transition name="modal">
      <div v-if="showAvatarModal" class="modal-overlay" @click="showAvatarModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>🖼️ 编辑头像</h3>
            <button @click="showAvatarModal = false" class="close-btn">✕</button>
          </div>
          <div class="avatar-form">
            <div class="avatar-preview-section">
              <div class="avatar-preview-large">
                <img v-if="avatarPreview" :src="avatarPreview" :alt="userName">
                <span v-else>👤</span>
              </div>
            </div>
            <div class="avatar-upload-section">
              <div class="cover-upload-zone" @click="triggerAvatarSelect">
                <input 
                  type="file" 
                  ref="avatarInput"
                  @change="handleAvatarSelect"
                  accept="image/*"
                  style="display: none"
                >
                <div v-if="avatarPreview" class="cover-preview">
                  <img :src="avatarPreview" alt="头像预览" class="preview-image">
                  <button @click.stop="removeAvatar" class="remove-cover-btn">✕</button>
                </div>
                <div v-else class="cover-placeholder">
                  <div class="cover-icon">📷</div>
                  <p>点击上传头像</p>
                  <p class="cover-info">支持格式: JPG, PNG, WEBP</p>
                </div>
              </div>
            </div>
            <div class="avatar-actions">
              <button @click="saveAvatar" class="save-avatar-btn" :disabled="!avatarPreview">
                <span>✓</span>
                <span>保存头像</span>
              </button>
              <button @click="removeAvatar" class="remove-avatar-btn">
                <span>🗑</span>
                <span>移除头像</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { songAPI, playerAPI, userAPI } from '@/api'
import AnimatedBackground from './AnimatedBackground.vue'
import ThemeToggle from './ThemeToggle.vue'

const router = useRouter()
const isDarkMode = ref(false)
const currentSong = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(80)
const isMuted = ref(false)
const isLiked = ref(false)
const playMode = ref('sequence')
const audioElement = ref(null)
const isLoggedIn = ref(false)
const userName = ref('')
const userAvatar = ref('')
const showLoginModal = ref(false)
const loginUsername = ref('')
const loginPassword = ref('')
const showAvatarModal = ref(false)
const avatarPreview = ref('')
const avatarInput = ref(null)
const mobileMenuOpen = ref(false)

const playModes = ['sequence', 'random', 'loop', 'single']
const playModeIcons = {
  sequence: '🔁',
  random: '🔀',
  loop: '🔁',
  single: '🔂'
}
const playModeTexts = {
  sequence: '顺序播放',
  random: '随机播放',
  loop: '列表循环',
  single: '单曲循环'
}

const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const playModeIcon = computed(() => playModeIcons[playMode.value])
const playModeText = computed(() => playModeTexts[playMode.value])

const checkLoginStatus = async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const response = await userAPI.getProfile()
      if (response.success) {
        isLoggedIn.value = true
        userName.value = response.data.username
        userAvatar.value = response.data.avatar || ''
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
    }
  }
}

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    localStorage.setItem('theme', 'dark')
    document.body.classList.add('dark-mode')
  } else {
    localStorage.setItem('theme', 'light')
    document.body.classList.remove('dark-mode')
  }
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDarkMode: isDarkMode.value } }))
}

const togglePlay = () => {
  if (audioElement.value) {
    if (isPlaying.value) {
      audioElement.value.pause()
    } else {
      audioElement.value.play()
    }
  }
}

const playPrevious = () => {
  console.log('播放上一首')
}

const playNext = () => {
  console.log('播放下一首')
}

const togglePlayMode = () => {
  const currentIndex = playModes.indexOf(playMode.value)
  const nextIndex = (currentIndex + 1) % playModes.length
  playMode.value = playModes[nextIndex]
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (audioElement.value) {
    audioElement.value.muted = isMuted.value
  }
}

const updateVolume = () => {
  if (audioElement.value) {
    audioElement.value.volume = volume.value / 100
  }
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
}

const togglePlaylist = () => {
  router.push('/playlist')
}

const showLyrics = () => {
  console.log('显示歌词')
}

const handleLogin = async () => {
  if (!loginUsername.value.trim() || !loginPassword.value.trim()) {
    alert('请输入用户名和密码')
    return
  }
  
  try {
    const response = await userAPI.login({
      username: loginUsername.value,
      password: loginPassword.value
    })
    
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      isLoggedIn.value = true
      userName.value = response.data.user.username
      userAvatar.value = response.data.user.avatar || ''
      showLoginModal.value = false
      loginUsername.value = ''
      loginPassword.value = ''
    }
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请检查用户名和密码')
  }
}

const logout = () => {
  isLoggedIn.value = false
  userName.value = ''
  userAvatar.value = ''
  localStorage.removeItem('token')
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('userName')
  localStorage.removeItem('userAvatar')
  router.push('/login')
}

const triggerAvatarSelect = () => {
  if (avatarInput.value) {
    avatarInput.value.click()
  }
}

const handleAvatarSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('头像图片大小超过10MB限制')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        let width = img.width
        let height = img.height
        const maxSize = 140
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        avatarPreview.value = canvas.toDataURL('image/jpeg', 0.8)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const saveAvatar = async () => {
  if (avatarPreview.value) {
    try {
      const response = await userAPI.updateProfile({ avatar: avatarPreview.value })
      if (response.success) {
        userAvatar.value = response.data.avatar
        localStorage.setItem('userAvatar', response.data.avatar)
        showAvatarModal.value = false
        avatarPreview.value = ''
      }
    } catch (error) {
      console.error('保存头像失败:', error)
      alert('保存头像失败')
    }
  }
}

const removeAvatar = () => {
  userAvatar.value = ''
  avatarPreview.value = ''
  localStorage.removeItem('userAvatar')
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
}

const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.body.classList.add('dark-mode')
  }
  
  checkLoginStatus()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

.app-layout.dark-mode {
  background-color: transparent;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 1000;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 20px 0;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  margin: 0 20px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(5px);
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
}

.nav-text {
  font-size: 15px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-name {
  font-weight: 600;
  font-size: 15px;
}

.user-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* 主内容区域 */
.main-content {
  flex: 1;
  margin-left: 240px;
  padding-bottom: 80px;
  min-height: 100vh;
}

.content-wrapper {
  padding: 20px;
}

/* 底部播放器栏 */
.bottom-player {
  position: fixed;
  bottom: 0;
  left: 240px;
  right: 0;
  background: white;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.15);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 999;
}

.dark-mode .bottom-player {
  background: #2a2a2a;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 0 0 1;
}

.player-cover {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.player-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.dark-mode .player-title {
  color: #fff;
}

.player-artist {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.dark-mode .player-artist {
  color: #999;
}

.like-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 5px;
  border-radius: 50%;
}

.like-btn:hover {
  transform: scale(1.2);
}

.like-btn.liked {
  color: #ff4444;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 1;
}

.control-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #333;
}

.dark-mode .control-btn {
  background: #3a3a3a;
  color: #fff;
}

.control-btn:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.dark-mode .control-btn:hover {
  background: #4a4a4a;
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 45px;
  height: 45px;
  font-size: 20px;
}

.play-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.mode-btn {
  font-size: 16px;
}

.player-progress {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 0 0 1;
}

.time {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.dark-mode .time {
  color: #999;
}

.progress-bar-wrapper {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.dark-mode .progress-bar-wrapper {
  background: #3a3a3a;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.1s linear;
}

.player-volume {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 5px;
  border-radius: 50%;
}

.volume-btn:hover {
  transform: scale(1.1);
}

.volume-slider {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.dark-mode .volume-slider {
  background: #3a3a3a;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.playlist-btn,
.lyrics-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 8px;
}

.playlist-btn:hover,
.lyrics-btn:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.dark-mode .playlist-btn:hover,
.dark-mode .lyrics-btn:hover {
  background: #3a3a3a;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }
  
  .main-content {
    margin-left: 200px;
  }
  
  .bottom-player {
    left: 200px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 2000;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .bottom-player {
    left: 0;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 15px;
  }
  
  .player-info {
    flex: 1 1 100%;
    min-width: 0;
  }
  
  .player-controls {
    flex: 0 0 auto;
  }
  
  .player-progress {
    flex: 1 1 100%;
    order: 2;
  }
  
  .player-volume {
    display: none;
  }
  
  .volume-slider {
    display: none;
  }
  
  .playlist-btn,
  .lyrics-btn {
    display: none;
  }
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 移动端遮罩层 */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}

@media (max-width: 768px) {
  .mobile-overlay.show {
    display: block;
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s ease;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.login-form {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
  background-color: white;
  color: #333;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.login-submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.logout-btn {
  margin-top: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateX(-5px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* 头像编辑样式 */
.avatar-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.avatar-preview-section {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
}

.avatar-preview-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}

.avatar-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-preview-large span {
  font-size: 48px;
}

.avatar-upload-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.save-avatar-btn {
  flex: 1;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.save-avatar-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.save-avatar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.remove-avatar-btn {
  flex: 1;
  padding: 12px 24px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.remove-avatar-btn:hover {
  background-color: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-upload-zone:hover {
  border-color: #667eea;
  background-color: #f0f0f0;
}

.avatar-upload-zone .cover-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-upload-zone .cover-preview img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 140px;
  object-fit: contain;
  border-radius: 8px;
}

.avatar-upload-zone .preview-image {
  width: 100%;
  height: 100%;
  max-width: 140px;
  max-height: 140px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
}

.avatar-upload-zone .cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-upload-zone .cover-icon {
  font-size: 36px;
  margin-bottom: 5px;
  transition: transform 0.3s ease;
}

.avatar-upload-zone:hover .cover-icon {
  transform: scale(1.1);
}

.avatar-upload-zone .cover-info {
  color: #999;
  font-size: 12px;
}
</style>