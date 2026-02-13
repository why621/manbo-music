<template>
  <div class="history-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="history-header">
      <h3>🕐 收听历史</h3>
      <div class="header-actions">
        <button @click="clearHistory" class="clear-btn" v-if="history.length > 0">
          <span>🗑️</span>
          <span>清空历史</span>
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="history.length === 0" class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>暂无收听历史</p>
      <p class="empty-hint">开始播放音乐来记录你的收听历史</p>
    </div>
    
    <div v-else class="history-list">
      <div 
        v-for="item in history" 
        :key="item.id" 
        class="history-item"
        @click="playSong(item)"
      >
        <div class="history-cover">
          <img :src="item.song_cover" :alt="item.song_title">
          <div class="play-overlay">
            <span>▶</span>
          </div>
        </div>
        <div class="history-info">
          <h4 class="history-title">{{ item.song_title }}</h4>
          <p class="history-artist">{{ item.song_artist }}</p>
          <div class="history-meta">
            <span class="history-time">{{ formatTime(item.played_at) }}</span>
            <span class="history-count">播放 {{ item.play_count }} 次</span>
          </div>
        </div>
        <div class="history-actions">
          <button @click.stop="addToPlaylist(item.song_id)" class="add-playlist-btn">
            <span>📋</span>
          </button>
          <button @click.stop="deleteHistory(item.id)" class="delete-btn">
            <span>🗑️</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { songAPI, playlistAPI } from '@/api'

const router = useRouter()

const isDarkMode = ref(false)
const history = ref([])
const loading = ref(true)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
  }
  
  window.addEventListener('themeChange', handleThemeChange)
  fetchHistory()
})

const handleThemeChange = (event) => {
  isDarkMode.value = event.detail.isDarkMode
}

const fetchHistory = async () => {
  try {
    loading.value = true
    const response = await songAPI.getHistory({ limit: 50 })
    history.value = response.data || []
  } catch (error) {
    console.error('获取收听历史失败:', error)
    history.value = []
  } finally {
    loading.value = false
  }
}

const playSong = (item) => {
  router.push({ name: 'Player', params: { id: item.song_id } })
}

const addToPlaylist = async (songId) => {
  try {
    const response = await playlistAPI.getList()
    if (response.data && response.data.length > 0) {
      await playlistAPI.addSong(response.data[0].id, songId)
      alert('已添加到第一个歌单')
    } else {
      alert('请先创建歌单')
    }
  } catch (error) {
    console.error('添加到歌单失败:', error)
    alert('添加失败，请稍后重试')
  }
}

const deleteHistory = async (id) => {
  if (!confirm('确定要删除这条收听历史吗？')) {
    return
  }
  
  try {
    await songAPI.deleteHistory(id)
    history.value = history.value.filter(item => item.id !== id)
  } catch (error) {
    console.error('删除历史失败:', error)
    alert('删除失败，请稍后重试')
  }
}

const clearHistory = async () => {
  if (!confirm('确定要清空所有收听历史吗？此操作不可恢复。')) {
    return
  }
  
  try {
    await songAPI.clearHistory()
    history.value = []
  } catch (error) {
    console.error('清空收听历史失败:', error)
    alert('清空失败，请稍后重试')
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.history-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  padding: 50px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.history-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #42b883 100%);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 0 0 20px 0;
  position: relative;
}

.history-header h3 {
  margin: 0;
  font-size: 36px;
  color: #333;
  font-weight: 800;
  letter-spacing: 2px;
}

.clear-btn {
  padding: 16px 32px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
}

.clear-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.5);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;
  color: #666;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: #666;
}

.empty-icon {
  font-size: 100px;
  margin-bottom: 30px;
  opacity: 0.6;
}

.empty-state p {
  margin: 10px 0;
  font-size: 18px;
  font-weight: 500;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin-top: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-item {
  display: flex;
  gap: 25px;
  padding: 25px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.history-item:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  background: linear-gradient(145deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.history-cover {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.history-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.history-item:hover .history-cover img {
  transform: scale(1.1);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.history-item:hover .play-overlay {
  opacity: 1;
}

.play-overlay span {
  font-size: 36px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.history-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-artist {
  margin: 0;
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 5px;
}

.history-time {
  font-size: 14px;
  color: #999;
  font-weight: 400;
  background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
  padding: 4px 12px;
  border-radius: 10px;
}

.history-count {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  padding: 4px 12px;
  border-radius: 10px;
}

.history-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.add-playlist-btn,
.delete-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 120px;
}

.add-playlist-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-playlist-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
}

.delete-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

@media (max-width: 768px) {
  .history-container {
    padding: 30px 20px;
  }
  
  .history-header h3 {
    font-size: 28px;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    padding: 20px;
  }
  
  .history-cover {
    width: 80px;
    height: 80px;
  }
  
  .history-actions {
    flex-direction: row;
    width: 100%;
    justify-content: center;
  }
  
  .add-playlist-btn,
  .delete-btn {
    width: auto;
    flex: 1;
  }
}
</style>
