<template>
  <div class="player">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="currentSong" class="player-content">
      <!-- 歌曲信息 -->
      <div class="song-details">
        <div class="cover-container">
          <img :src="currentSong.cover" :alt="currentSong.title" class="cover-image">
          <div class="cover-overlay">
            <div class="cover-badge">🎵</div>
          </div>
        </div>
        <div class="song-info">
          <h3 class="song-title">{{ currentSong.title }}</h3>
          <p class="artist">{{ currentSong.artist }}</p>
          <p class="album">{{ currentSong.album }}</p>
          <div class="song-meta">
            <span class="genre">{{ currentSong.genre }}</span>
            <span class="length">{{ formatDuration(currentSong.length) }}</span>
          </div>
          <div class="song-actions">
            <button @click.stop="showAddToPlaylist" class="add-playlist-btn">
              <span>➕</span>
              <span>添加到歌单</span>
            </button>
            <button @click.stop="downloadSong" class="download-btn">
              <span>⬇️</span>
              <span>下载</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 播放控制 -->
      <div class="playback-controls">
        <audio 
          ref="audioElement" 
          :src="currentSong.url" 
          @timeupdate="updateProgress"
          @ended="onSongEnded"
          @play="isPlaying = true"
          @pause="isPlaying = false"
        >
          您的浏览器不支持音频播放
        </audio>
        
        <div class="controls">
          <button @click="playPrevious" class="control-btn">
            <span>⏮</span>
          </button>
          <button @click="togglePlay" class="control-btn play-btn">
            <span>{{ isPlaying ? '⏸' : '▶' }}</span>
          </button>
          <button @click="playNext" class="control-btn">
            <span>⏭</span>
          </button>
        </div>
        
        <!-- 进度条 -->
        <div class="progress-container">
          <span class="time">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar-wrapper">
            <input 
              type="range" 
              v-model="seekTime" 
              :min="0" 
              :max="duration" 
              @input="seek"
              class="progress-bar"
            >
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="time">{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <!-- 播放队列 -->
      <div class="queue-section">
        <div class="queue-header">
          <h4>📋 播放队列</h4>
          <div class="queue-count">{{ queue.length }} 首歌曲</div>
        </div>
        <div v-if="queueLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <ul v-else class="queue-list">
          <li 
            v-for="(item, index) in queue" 
            :key="item.id"
            class="queue-item"
            :class="{ active: currentSong.id == item.song_id }"
            @click="playQueueSong(item.song_id)"
          >
            <span class="queue-index">{{ index + 1 }}</span>
            <div class="queue-info">
              <span class="queue-title">{{ item.title }}</span>
              <span class="queue-artist">{{ item.artist }}</span>
            </div>
            <div class="queue-play">▶</div>
          </li>
        </ul>
      </div>
      
      <!-- 评论区 -->
      <div class="comments-section">
        <Comments v-if="currentSong" :song-id="currentSong.id" />
      </div>
    </div>
    
    <div v-else class="no-song">
      <div class="no-song-content">
        <div class="no-song-icon">🎵</div>
        <h3>选择一首歌开始播放</h3>
        <p>从歌曲列表中选择你喜欢的音乐</p>
        <button @click="goBack" class="back-btn">
          <span>←</span>
          <span>返回歌曲列表</span>
        </button>
      </div>
    </div>
    
    <!-- 添加到歌单弹窗 -->
    <transition name="modal">
      <div v-if="showPlaylistModal" class="modal-overlay" @click="showPlaylistModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>📝 添加到歌单</h3>
            <button @click="showPlaylistModal = false" class="close-btn">✕</button>
          </div>
          <div v-if="playlistsLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载歌单中...</p>
          </div>
          <div v-else-if="playlists.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>暂无歌单，请先创建歌单</p>
          </div>
          <div v-else class="playlist-list">
            <div 
              v-for="playlist in playlists" 
              :key="playlist.id" 
              class="playlist-option"
              @click="addToPlaylist(playlist.id)"
            >
              <div class="playlist-info">
                <h4>{{ playlist.name }}</h4>
                <p>{{ playlist.description }}</p>
                <span class="song-count">{{ playlist.song_count }} 首歌曲</span>
              </div>
              <div class="playlist-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { songAPI, playerAPI, playlistAPI } from '@/api'
import Comments from '@/components/Comments.vue'

const route = useRoute()
const router = useRouter()
const currentSong = ref(null)
const loading = ref(true)
const queueLoading = ref(true)
const queue = ref([])
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const audioElement = ref(null)
const showPlaylistModal = ref(false)
const playlists = ref([])
const playlistsLoading = ref(false)

// 计算属性：格式化的进度条时间
const seekTime = computed({
  get: () => currentTime.value,
  set: (value) => {
    currentTime.value = value
    seek()
  }
})

// 计算属性：进度百分比
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 根据路由参数获取歌曲
const fetchSong = async (songId) => {
  if (!songId) {
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    const response = await songAPI.getById(songId)
    currentSong.value = response.data
    
    if (currentSong.value && currentSong.value.url) {
      if (currentSong.value.url.startsWith('/')) {
        currentSong.value.url = window.location.origin + currentSong.value.url
      }
    }
    
    if (currentSong.value && currentSong.value.cover) {
      if (currentSong.value.cover.startsWith('/')) {
        currentSong.value.cover = window.location.origin + currentSong.value.cover
      }
    }
    
    // 添加到历史记录
    if (currentSong.value) {
      await songAPI.addToHistory({
        song_id: parseInt(songId),
        song_title: currentSong.value.title,
        song_artist: currentSong.value.artist,
        song_cover: currentSong.value.cover
      })
    }
  } catch (error) {
    console.error('获取歌曲详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取播放队列
const fetchQueue = async () => {
  try {
    queueLoading.value = true
    const response = await playerAPI.getQueue()
    queue.value = response.data || []
  } catch (error) {
    console.error('获取播放队列失败:', error)
  } finally {
    queueLoading.value = false
  }
}

// 更新播放进度
const updateProgress = (event) => {
  currentTime.value = event.target.currentTime
  duration.value = event.target.duration || 0
}

// 跳转播放位置
const seek = () => {
  if (audioElement.value) {
    audioElement.value.currentTime = currentTime.value
  }
}

// 切换播放/暂停
const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play()
  }
}

// 播放上一首
const playPrevious = () => {
  // 简单实现：从队列中找到当前歌曲的前一首
  const currentIndex = queue.value.findIndex(item => item.song_id == currentSong.value.id)
  if (currentIndex > 0) {
    const previousSongId = queue.value[currentIndex - 1].song_id
    playQueueSong(previousSongId)
  }
}

// 播放下一首
const playNext = () => {
  // 简单实现：从队列中找到当前歌曲的后一首
  const currentIndex = queue.value.findIndex(item => item.song_id == currentSong.value.id)
  if (currentIndex < queue.value.length - 1) {
    const nextSongId = queue.value[currentIndex + 1].song_id
    playQueueSong(nextSongId)
  }
}

// 播放队列中的歌曲
const playQueueSong = (songId) => {
  router.push({ name: 'Player', params: { id: songId } })
}

// 歌曲播放结束
const onSongEnded = () => {
  playNext()
}

// 格式化时间（秒 -> MM:SS）
const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化歌曲时长
const formatDuration = (seconds) => {
  return formatTime(seconds)
}

// 返回歌曲列表
const goBack = () => {
  router.push({ name: 'Home' })
}

// 显示添加到歌单弹窗
const showAddToPlaylist = async () => {
  console.log('showAddToPlaylist called')
  try {
    playlistsLoading.value = true
    showPlaylistModal.value = true
    console.log('showPlaylistModal set to true')
    const response = await playlistAPI.getList()
    playlists.value = response.data || []
    console.log('playlists loaded:', playlists.value)
  } catch (error) {
    console.error('获取歌单列表失败:', error)
  } finally {
    playlistsLoading.value = false
  }
}

// 添加歌曲到歌单
const addToPlaylist = async (playlistId) => {
  if (!currentSong.value) return
  
  try {
    await playlistAPI.addSong(playlistId, currentSong.value.id)
    showPlaylistModal.value = false
    alert('歌曲已添加到歌单！')
  } catch (error) {
    console.error('添加歌曲到歌单失败:', error)
    alert('添加歌曲失败，请稍后重试')
  }
}

// 下载歌曲
const downloadSong = () => {
  if (!currentSong.value) return
  
  try {
    songAPI.download(currentSong.value.id)
  } catch (error) {
    console.error('下载歌曲失败:', error)
    alert('下载失败，请稍后重试')
  }
}

// 监听路由变化
watch(() => route.params.id, (newId) => {
  fetchSong(newId)
})

// 组件挂载时获取
onMounted(() => {
  fetchSong(route.params.id)
  fetchQueue()
})
</script>

<style scoped>
.player {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.song-details {
  display: flex;
  align-items: center;
  margin: 40px 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  padding: 50px;
  border-radius: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  gap: 40px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.cover-container {
  position: relative;
  flex-shrink: 0;
}

.cover-image {
  width: 240px;
  height: 240px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.cover-container:hover .cover-image {
  transform: scale(1.08) rotate(2deg);
}

.cover-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cover-badge {
  font-size: 20px;
}

.song-info {
  flex: 1;
  text-align: left;
  overflow: visible;
  position: relative;
}

.song-title {
  margin: 0 0 15px 0;
  font-size: 36px;
  font-weight: 800;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.artist {
  margin: 0 0 10px 0;
  font-size: 22px;
  color: #666;
  font-weight: 600;
}

.album {
  margin: 0 0 25px 0;
  font-size: 16px;
  color: #999;
  font-weight: 500;
}

.song-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.genre, .length {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 13px;
  color: white;
  font-weight: 500;
}

.song-actions {
  margin-top: 30px;
  position: relative;
  z-index: 10;
  display: flex;
  gap: 15px;
}

.add-playlist-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.add-playlist-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.download-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #42b883 0%, #349268 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.2);
}

.download-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(66, 184, 131, 0.4);
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 184, 131, 0.4);
}

.playback-controls {
  margin: 40px 0;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 30px 0;
}

.control-btn {
  background-color: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #333;
}

.control-btn:hover {
  background-color: #e0e0e0;
  transform: scale(1.1);
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 70px;
  height: 70px;
  font-size: 28px;
}

.play-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 25px 0;
}

.time {
  font-size: 14px;
  color: #666;
  min-width: 50px;
  font-weight: 500;
}

.progress-bar-wrapper {
  flex: 1;
  position: relative;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  width: 100%;
  height: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  border: none;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.progress-bar::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.1s linear;
}

.queue-section {
  margin-top: 40px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.queue-header h4 {
  margin: 0;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}

.queue-count {
  font-size: 14px;
  color: #666;
  background-color: #f5f5f5;
  padding: 6px 14px;
  border-radius: 12px;
  font-weight: 500;
}

.queue-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 5px;
}

.queue-item:hover {
  background-color: #f9f9f9;
  transform: translateX(5px);
}

.queue-item.active {
  background-color: #e8f5e8;
  border-left: 4px solid #42b883;
}

.queue-index {
  width: 40px;
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.queue-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.queue-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.queue-artist {
  font-size: 14px;
  color: #666;
}

.queue-play {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
}

.queue-item:hover .queue-play {
  opacity: 1;
  transform: scale(1);
}

.no-song {
  text-align: center;
  padding: 80px 20px;
}

.no-song-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.no-song-icon {
  font-size: 80px;
  opacity: 0.8;
}

.no-song h3 {
  margin: 0;
  font-size: 28px;
  color: white;
  font-weight: 600;
}

.no-song p {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
}

.back-btn {
  padding: 15px 30px;
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
  gap: 8px;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 评论区样式 */
.comments-section {
  margin-top: 40px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* 添加到歌单弹窗样式 */
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 25px 20px;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.playlist-list {
  padding: 20px;
}

.playlist-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-option:hover {
  background-color: #f9f9f9;
  border-color: #667eea;
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.playlist-info {
  flex: 1;
}

.playlist-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.playlist-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.song-count {
  display: inline-block;
  background-color: #e0e0e0;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.playlist-arrow {
  font-size: 24px;
  color: #667eea;
  font-weight: bold;
  transition: transform 0.2s ease;
}

.playlist-option:hover .playlist-arrow {
  transform: translateX(5px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player {
    padding: 15px 10px;
    padding-top: 70px;
  }
  
  .song-details {
    flex-direction: column;
    text-align: center;
    padding: 20px 15px;
  }
  
  .cover-container {
    width: 200px;
    height: 200px;
    margin: 0 auto 20px;
  }
  
  .cover-image {
    margin-right: 0;
    margin-bottom: 0;
  }
  
  .song-info {
    text-align: center;
    width: 100%;
  }
  
  .song-title {
    font-size: 20px;
  }
  
  .artist {
    font-size: 14px;
  }
  
  .album {
    font-size: 12px;
  }
  
  .song-meta {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .song-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .add-playlist-btn, .download-btn {
    width: 100%;
  }
  
  .playback-controls {
    padding: 15px;
  }
  
  .controls {
    gap: 15px;
  }
  
  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .play-btn {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
  
  .progress-container {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .progress-bar-wrapper {
    order: 2;
    flex: 1 1 100%;
  }
  
  .time {
    flex: 1;
    text-align: center;
  }
  
  .queue-section {
    padding: 15px;
  }
  
  .queue-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .queue-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }
  
  .queue-info {
    width: 100%;
  }
  
  .queue-title {
    font-size: 14px;
  }
  
  .queue-artist {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .player {
    padding: 10px;
    padding-top: 65px;
  }
  
  .cover-container {
    width: 160px;
    height: 160px;
  }
  
  .song-title {
    font-size: 18px;
  }
  
  .control-btn {
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
  
  .play-btn {
    width: 55px;
    height: 55px;
    font-size: 22px;
  }
}
</style>