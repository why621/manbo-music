<template>
  <div class="home">
    <div class="hero-section">
      <h1 class="hero-title">🎵 曼波音乐</h1>
      <p class="hero-subtitle">发现、播放和分享你喜爱的音乐</p>
    </div>
    
    <!-- 服务器状态 -->
    <div class="status-card">
      <div class="status-header">
        <h3>🖥️ 服务器状态</h3>
      </div>
      <p v-if="loading">检查中...</p>
      <div v-else class="status-items">
        <div class="status-item" :class="{ 'success': status.api, 'error': !status.api }">
          <span class="status-icon">{{ status.api ? '✅' : '❌' }}</span>
          <span class="status-text">后端API</span>
        </div>
        <div class="status-item" :class="{ 'success': status.db, 'error': !status.db }">
          <span class="status-icon">{{ status.db ? '✅' : '❌' }}</span>
          <span class="status-text">数据库</span>
        </div>
        <div class="status-item" :class="{ 'success': status.redis, 'error': !status.redis }">
          <span class="status-icon">{{ status.redis ? '✅' : '❌' }}</span>
          <span class="status-text">Redis</span>
        </div>
      </div>
    </div>
    
    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-container">
        <input 
          type="text" 
          id="searchInput"
          v-model="searchQuery" 
          placeholder="🔍 搜索歌曲、歌手或专辑..."
          class="search-input"
        >
        <button @click="searchSongs(searchQuery)" class="search-btn">
          <span>搜索</span>
        </button>
      </div>
    </div>
    
    <!-- 热门歌曲 -->
    <div class="songs-section">
      <div class="section-header">
        <h3>🔥 热门歌曲</h3>
        <div class="section-divider"></div>
      </div>
      <div v-if="songsLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="songs.length === 0" class="empty-state">
        <div class="empty-icon">🎵</div>
        <p>暂无歌曲</p>
      </div>
      <div v-else class="songs-grid">
        <div 
          v-for="song in songs" 
          :key="song.id" 
          class="song-card"
          @click="playSong(song)"
        >
          <div class="song-cover-container">
            <img :src="song.cover" :alt="song.title" class="song-cover">
            <div class="song-overlay">
              <div class="play-overlay">
                <span class="play-icon">▶</span>
              </div>
            </div>
          </div>
          <div class="song-info">
            <h4 class="song-title">{{ song.title }}</h4>
            <p class="song-artist">{{ song.artist }}</p>
            <p class="song-album">{{ song.album }}</p>
            <div class="song-meta">
              <span class="song-genre">{{ song.genre }}</span>
            </div>
          </div>
          <div class="song-actions">
            <button @click.stop="playSong(song)" class="play-btn">
              <span>▶</span>
              <span>播放</span>
            </button>
            <button @click.stop="showAddToPlaylist(song)" class="add-playlist-btn">
              <span>➕</span>
              <span>添加到歌单</span>
            </button>
            <button @click.stop="downloadSong(song)" class="download-btn">
              <span>⬇️</span>
              <span>下载</span>
            </button>
          </div>
        </div>
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
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { healthAPI, songAPI, playlistAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const songsLoading = ref(true)
const status = ref({ api: false, db: false, redis: false })
const songs = ref([])
const searchQuery = ref('')
const showPlaylistModal = ref(false)
const playlists = ref([])
const playlistsLoading = ref(false)
const selectedSong = ref(null)
let searchTimeout = null

// 检查服务器状态
const checkServerStatus = async () => {
  try {
    const [healthRes, dbRes, redisRes] = await Promise.all([
      healthAPI.getStatus(),
      healthAPI.checkDB(),
      healthAPI.checkRedis()
    ])
    
    status.value = {
      api: true, // 简化判断，只要能获取到响应就算正常
      db: dbRes.connected,
      redis: redisRes.connected
    }
  } catch (error) {
    console.error('检查服务器状态失败:', error)
    status.value = { api: false, db: false, redis: false }
  } finally {
    loading.value = false
  }
}

// 获取歌曲列表
const fetchSongs = async () => {
  try {
    songsLoading.value = true
    console.log('获取歌曲列表...')
    const response = await songAPI.getList({ limit: 10, order: 'popular' })
    console.log('获取歌曲响应:', response)
    songs.value = (response.data || []).map(song => {
      if (song.cover && song.cover.startsWith('/')) {
        song.cover = window.location.origin + song.cover
      }
      return song
    })
    console.log('处理后的歌曲列表:', songs.value)
  } catch (error) {
    console.error('获取歌曲失败:', error)
  } finally {
    songsLoading.value = false
  }
}

// 搜索歌曲（实时搜索，带防抖）
const searchSongs = async (query) => {
  console.log('搜索函数被调用，查询词:', query)
  
  if (!query || !query.trim()) {
    console.log('查询词为空，获取所有歌曲')
    return fetchSongs()
  }
  
  try {
    songsLoading.value = true
    console.log('发送搜索请求:', query.trim())
    const response = await songAPI.search(query.trim())
    console.log('搜索响应:', response)
    songs.value = (response.data || []).map(song => {
      if (song.cover && song.cover.startsWith('/')) {
        song.cover = 'http://localhost:8080' + song.cover
      }
      return song
    })
    console.log('处理后的歌曲列表:', songs.value)
  } catch (error) {
    console.error('搜索歌曲失败:', error)
    songs.value = []
  } finally {
    songsLoading.value = false
  }
}

// 监听搜索框输入，实现实时搜索
watch(searchQuery, (newQuery) => {
  console.log('watch 触发，新的查询词:', newQuery)
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    console.log('防抖后执行搜索:', newQuery)
    searchSongs(newQuery)
  }, 300)
})

// 播放歌曲
const playSong = (song) => {
  // 添加到历史记录
  songAPI.addToHistory({
    song_id: song.id,
    song_title: song.title,
    song_artist: song.artist,
    song_cover: song.cover
  })
  router.push({ name: 'Player', params: { id: song.id } })
}

// 显示添加到歌单弹窗
const showAddToPlaylist = (song) => {
  selectedSong.value = song
  showPlaylistModal.value = true
  fetchPlaylists()
}

// 获取歌单列表
const fetchPlaylists = async () => {
  try {
    playlistsLoading.value = true
    const response = await playlistAPI.getList()
    playlists.value = response.data || []
  } catch (error) {
    console.error('获取歌单列表失败:', error)
  } finally {
    playlistsLoading.value = false
  }
}

// 添加歌曲到歌单
const addToPlaylist = async (playlistId) => {
  if (!selectedSong.value) return
  
  try {
    await playlistAPI.addSong(playlistId, selectedSong.value.id)
    showPlaylistModal.value = false
    selectedSong.value = null
    alert('歌曲已添加到歌单！')
  } catch (error) {
    console.error('添加歌曲到歌单失败:', error)
    alert('添加歌曲失败，请稍后重试')
  }
}

// 下载歌曲
const downloadSong = (song) => {
  try {
    songAPI.download(song.id)
  } catch (error) {
    console.error('下载歌曲失败:', error)
    alert('下载失败，请稍后重试')
  }
}

onMounted(() => {
  console.log('Home 组件已挂载')
  console.log('searchQuery 初始值:', searchQuery.value)
  checkServerStatus()
  fetchSongs()
})
</script>

<style scoped>
.home {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  margin-bottom: 50px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.hero-title {
  font-size: 64px;
  font-weight: 800;
  color: white;
  margin: 0 0 20px 0;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
}

.status-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 30px;
  margin: 20px 0;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #42b883 100%);
}

.status-header h3 {
  margin: 0 0 25px 0;
  font-size: 24px;
  color: #333;
  font-weight: 700;
}

.status-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.status-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.status-item.success {
  background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
  border: 2px solid #42b883;
}

.status-item.error {
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  border: 2px solid #ff4444;
}

.status-icon {
  font-size: 24px;
}

.status-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.search-section {
  margin: 40px 0;
  position: relative;
}

.search-container {
  display: flex;
  gap: 15px;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  padding: 8px;
  border-radius: 60px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.search-container:focus-within {
  box-shadow: 0 16px 48px rgba(102, 126, 234, 0.4);
  border-color: #667eea;
  transform: scale(1.02);
}

.search-input {
  flex: 1;
  padding: 18px 25px;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  background: transparent;
  color: #333;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #999;
  font-weight: 400;
}

.search-input:focus {
  background: transparent;
  color: #333;
}

.search-btn {
  padding: 18px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.search-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}

.songs-section {
  margin: 50px 0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  padding: 0 0 20px 0;
  position: relative;
}

.section-header h3 {
  margin: 0;
  font-size: 36px;
  color: white;
  font-weight: 800;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

.section-header::before {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #667eea 50%, #764ba2 100%);
}

.section-divider {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
  margin-left: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.song-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.5s ease;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.song-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #42b883 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.song-card:hover::before {
  opacity: 1;
}

.song-card:hover {
  transform: translateY(-16px) scale(1.03);
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.3);
}

.song-cover-container {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.song-card:hover .song-cover {
  transform: scale(1.15);
}

.song-overlay {
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
  transition: opacity 0.4s ease;
}

.song-card:hover .song-overlay {
  opacity: 1;
}

.play-overlay {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.8);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.song-card:hover .play-overlay {
  transform: scale(1);
}

.play-icon {
  font-size: 28px;
  color: #667eea;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.song-info {
  padding: 20px;
  text-align: left;
}

.song-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-album {
  margin: 0 0 10px 0;
  font-size: 12px !important;
  color: #999 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-genre {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.song-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.play-btn, .add-playlist-btn, .download-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.play-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-playlist-btn {
  background-color: #f5f5f5;
  color: #333;
}

.add-playlist-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

.download-btn {
  background: linear-gradient(135deg, #42b883 0%, #349268 100%);
  color: white;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 550px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
  margin-bottom: 25px;
  padding-bottom: 20px;
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

.playlist-list {
  max-height: 350px;
  overflow-y: auto;
}

.playlist-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 8px;
}

.playlist-option:hover {
  background-color: #f9f9f9;
  transform: translateX(5px);
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
  .home {
    padding: 15px;
    padding-top: 70px;
  }
  
  .hero-section {
    padding: 40px 15px;
    border-radius: 20px;
    margin-bottom: 30px;
  }
  
  .hero-title {
    font-size: 32px;
    letter-spacing: 1px;
  }
  
  .hero-subtitle {
    font-size: 14px;
    padding: 0 10px;
  }
  
  .status-card {
    padding: 20px 15px;
    border-radius: 16px;
    margin: 15px 0;
  }
  
  .status-header h3 {
    font-size: 18px;
    margin-bottom: 15px;
  }
  
  .status-items {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .status-item {
    padding: 15px;
    border-radius: 12px;
  }
  
  .search-section {
    margin: 25px 0;
  }
  
  .search-container {
    flex-direction: column;
    border-radius: 16px;
    padding: 12px;
    gap: 10px;
  }
  
  .search-input {
    width: 100%;
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 15px;
  }
  
  .search-btn {
    width: 100%;
    border-radius: 12px;
    padding: 14px 20px;
    font-size: 15px;
  }
  
  .songs-section {
    margin: 30px 0;
  }
  
  .section-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
  }
  
  .section-header h3 {
    font-size: 24px;
    letter-spacing: 1px;
  }
  
  .songs-grid {
    grid-template-columns: 1fr;
    gap: 15px;
    margin-top: 15px;
  }
  
  .song-card {
    border-radius: 16px;
  }
  
  .song-card:hover {
    transform: none;
  }
  
  .song-cover-container {
    height: 180px;
  }
  
  .song-info {
    padding: 15px;
  }
  
  .song-title {
    font-size: 16px;
  }
  
  .song-artist {
    font-size: 13px;
  }
  
  .song-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .play-btn, .add-playlist-btn, .download-btn {
    width: 100%;
    padding: 12px;
  }
  
  .empty-state {
    padding: 40px 15px;
  }
  
  .empty-icon {
    font-size: 48px;
  }
  
  .modal-content {
    padding: 20px;
    margin: 15px;
    border-radius: 16px;
  }
  
  .modal-header {
    margin-bottom: 15px;
    padding-bottom: 15px;
  }
  
  .modal-header h3 {
    font-size: 18px;
  }
  
  .playlist-option {
    padding: 12px;
  }
  
  .playlist-info h4 {
    font-size: 14px;
  }
  
  .playlist-info p {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 26px;
  }
  
  .hero-subtitle {
    font-size: 13px;
  }
  
  .section-header h3 {
    font-size: 20px;
  }
  
  .song-cover-container {
    height: 160px;
  }
}
</style>
