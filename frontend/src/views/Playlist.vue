<template>
  <div class="playlist">
    <div class="playlist-container">
      <div class="hero-section">
        <h2 class="hero-title">🎵 我的歌单</h2>
        <p class="hero-subtitle">创建和管理你的音乐收藏</p>
      </div>
      
      <div class="create-playlist-section">
        <button @click="showCreateForm = true" class="create-btn">
          <span>+</span>
          <span>创建新歌单</span>
        </button>
        
        <transition name="form">
          <div v-if="showCreateForm" class="create-form">
            <div class="form-header">
              <h3>📝 创建新歌单</h3>
              <button @click="showCreateForm = false" class="close-form-btn">✕</button>
            </div>
            <form @submit.prevent="createPlaylist" class="playlist-form">
              <div class="form-group">
                <label for="playlistName">歌单名称 *</label>
                <input 
                  type="text" 
                  id="playlistName" 
                  v-model="newPlaylist.name" 
                  placeholder="请输入歌单名称"
                  required
                  class="form-input"
                >
              </div>
              
              <div class="form-group">
                <label for="playlistCover">封面图片</label>
                <div class="cover-upload-zone" @click="triggerCoverSelect">
                  <input 
                    type="file" 
                    id="playlistCover" 
                    ref="coverInput"
                    @change="handleCoverSelect"
                    accept="image/*"
                    style="display: none"
                  >
                  <div v-if="coverPreview" class="cover-preview">
                    <img :src="coverPreview" alt="封面预览">
                    <button @click.stop="removeCover" class="remove-cover-btn">✕</button>
                  </div>
                  <div v-else class="cover-placeholder">
                    <div class="cover-icon">🖼️</div>
                    <p>点击上传封面图片</p>
                    <p class="cover-info">支持格式: JPG, PNG, WEBP</p>
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="playlistDesc">描述</label>
                <textarea 
                  id="playlistDesc" 
                  v-model="newPlaylist.description" 
                  placeholder="请输入歌单描述"
                  rows="3"
                  class="form-textarea"
                ></textarea>
              </div>
              
              <div v-if="error" class="error-message">
                <span>⚠️</span>
                <span>{{ error }}</span>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="submit-btn" :disabled="creating">
                  <span v-if="creating" class="loading-spinner"></span>
                  <span>{{ creating ? '创建中...' : '创建' }}</span>
                </button>
                <button type="button" @click="showCreateForm = false" class="cancel-btn">取消</button>
              </div>
            </form>
          </div>
        </transition>
      </div>
      
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="playlists.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无歌单，创建一个开始收藏音乐吧！</p>
      </div>
      <div v-else class="playlists-grid">
        <div 
          v-for="playlist in playlists" 
          :key="playlist.id" 
          class="playlist-card"
          @click="viewPlaylist(playlist.id)"
        >
          <div class="playlist-cover-container">
            <img :src="playlist.cover" :alt="playlist.name" class="playlist-cover">
            <div class="playlist-overlay">
              <div class="playlist-badge">🎵</div>
            </div>
          </div>
          <div class="playlist-info">
            <h4 class="playlist-name">{{ playlist.name }}</h4>
            <p class="playlist-desc">{{ playlist.description }}</p>
            <div class="playlist-meta">
              <span class="song-count">
                <span>🎵</span>
                <span>{{ playlist.song_count }} 首歌曲</span>
              </span>
              <span class="created-date">{{ formatDate(playlist.created_at) }}</span>
            </div>
            <div class="playlist-actions">
              <button @click.stop="deletePlaylist(playlist.id)" class="delete-playlist-btn">
                <span>🗑</span>
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 歌单详情 -->
    <div v-if="selectedPlaylist" class="playlist-detail">
      <div class="detail-header">
        <button @click="selectedPlaylist = null" class="back-btn">
          <span>←</span>
          <span>返回歌单列表</span>
        </button>
        <div class="playlist-title-section">
          <h3>{{ selectedPlaylist.name }}</h3>
          <p>{{ selectedPlaylist.description }}</p>
        </div>
        <button @click="openSongSelector" class="add-songs-btn">
          <span>+</span>
          <span>添加歌曲</span>
        </button>
      </div>
      
      <div v-if="playlistSongsLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="playlistSongs.length === 0" class="empty-state">
        <div class="empty-icon">🎵</div>
        <p>歌单中暂无歌曲</p>
      </div>
      <ul v-else class="playlist-songs">
        <li v-for="song in playlistSongs" :key="song.id" class="playlist-song-item">
          <div class="song-info">
            <h4>{{ song.title }}</h4>
            <p>{{ song.artist }} - {{ song.album }}</p>
            <span class="song-genre">{{ song.genre }}</span>
          </div>
          <div class="song-actions">
            <button @click="playSong(song)" class="play-btn">
              <span>▶</span>
              <span>播放</span>
            </button>
            <button @click="removeSong(song.id)" class="remove-btn">
              <span>🗑</span>
              <span>移除</span>
            </button>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- 歌曲选择弹窗 -->
    <transition name="modal">
      <div v-if="showSongSelector" class="modal-overlay" @click="showSongSelector = false">
        <div class="modal-content song-selector-content" @click.stop>
          <div class="modal-header">
            <h3>🎵 选择要添加的歌曲</h3>
            <button @click="showSongSelector = false" class="close-btn">✕</button>
          </div>
          <div v-if="loadingSongs" class="loading-container">
            <div class="loading-spinner"></div>
            <p>加载歌曲中...</p>
          </div>
          <div v-else-if="availableSongs.length === 0" class="empty-state">
            <div class="empty-icon">🎵</div>
            <p>暂无可用歌曲</p>
          </div>
          <div v-else>
            <div class="song-selector-list">
              <div 
                v-for="song in availableSongs" 
                :key="song.id" 
                class="song-selector-item"
                :class="{ 'selected': selectedSongsToAdd.includes(song.id) }"
                @click="toggleSongSelection(song.id)"
              >
                <div class="song-selector-info">
                  <h4>{{ song.title }}</h4>
                  <p>{{ song.artist }} - {{ song.album }}</p>
                  <span class="song-genre">{{ song.genre }}</span>
                </div>
                <div class="song-selector-check">
                  <input 
                    type="checkbox" 
                    :checked="selectedSongsToAdd.includes(song.id)"
                    @change="toggleSongSelection(song.id)"
                  >
                </div>
              </div>
            </div>
            <div class="song-selector-actions">
              <button @click="addSelectedSongsToPlaylist" class="add-btn" :disabled="selectedSongsToAdd.length === 0">
                <span>✓</span>
                <span>添加选中的歌曲 ({{ selectedSongsToAdd.length }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { playlistAPI, songAPI } from '@/api'

const router = useRouter()
const playlists = ref([])
const selectedPlaylist = ref(null)
const playlistSongs = ref([])
const loading = ref(true)
const playlistSongsLoading = ref(false)
const showCreateForm = ref(false)
const creating = ref(false)
const error = ref('')
const newPlaylist = ref({
  name: '',
  description: ''
})
const showSongSelector = ref(false)
const availableSongs = ref([])
const selectedSongsToAdd = ref([])
const loadingSongs = ref(false)
const coverPreview = ref('')
const coverInput = ref(null)

onMounted(() => {
  fetchPlaylists()
})

const fetchPlaylists = async () => {
  try {
    loading.value = true
    const response = await playlistAPI.getList()
    playlists.value = (response.data || []).map(playlist => {
      if (playlist.cover && playlist.cover.startsWith('/')) {
        playlist.cover = 'http://localhost:8080' + playlist.cover
      }
      return playlist
    })
  } catch (err) {
    console.error('获取歌单列表失败:', err)
    error.value = '获取歌单列表失败'
  } finally {
    loading.value = false
  }
}

const viewPlaylist = async (playlistId) => {
  try {
    selectedPlaylist.value = playlists.value.find(p => p.id === playlistId)
    await fetchPlaylistSongs(playlistId)
  } catch (err) {
    console.error('获取歌单详情失败:', err)
    error.value = '获取歌单详情失败'
  }
}

const fetchPlaylistSongs = async (playlistId) => {
  try {
    playlistSongsLoading.value = true
    const response = await playlistAPI.getById(playlistId)
    playlistSongs.value = response.data.songs || []
  } catch (err) {
    console.error('获取歌单歌曲失败:', err)
    error.value = '获取歌单歌曲失败'
  } finally {
    playlistSongsLoading.value = false
  }
}

const createPlaylist = async () => {
  if (!newPlaylist.value.name.trim()) {
    error.value = '歌单名称不能为空'
    return
  }
  
  try {
    creating.value = true
    error.value = ''
    
    const formData = new FormData()
    formData.append('name', newPlaylist.value.name)
    formData.append('description', newPlaylist.value.description)
    
    if (coverInput.value?.files[0]) {
      formData.append('cover', coverInput.value.files[0])
    }
    
    const response = await playlistAPI.create(formData)
    
    playlists.value.push(response.data)
    showCreateForm.value = false
    newPlaylist.value = { name: '', description: '' }
    coverPreview.value = ''
    if (coverInput.value) {
      coverInput.value.value = ''
    }
  } catch (err) {
    error.value = '创建歌单失败'
    console.error('创建歌单错误:', err)
  } finally {
    creating.value = false
  }
}

const triggerCoverSelect = () => {
  if (coverInput.value) {
    coverInput.value.click()
  }
}

const handleCoverSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      error.value = '请选择图片文件'
      return
    }
    
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      error.value = '封面图片大小超过10MB限制'
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      coverPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    error.value = ''
  }
}

const removeCover = () => {
  coverPreview.value = ''
  if (coverInput.value) {
    coverInput.value.value = ''
  }
}

const addSongsToPlaylist = async () => {
  try {
    const songsResponse = await songAPI.getList({ limit: 10 })
    const songs = songsResponse.data || []
    
    for (let i = 0; i < Math.min(5, songs.length); i++) {
      await playlistAPI.addSong(selectedPlaylist.value.id, songs[i].id)
    }
    
    await fetchPlaylistSongs(selectedPlaylist.value.id)
  } catch (err) {
    error.value = '添加歌曲失败'
    console.error('添加歌曲错误:', err)
  }
}

const openSongSelector = async () => {
  try {
    loadingSongs.value = true
    showSongSelector.value = true
    selectedSongsToAdd.value = []
    
    const response = await songAPI.getList({ limit: 50 })
    availableSongs.value = response.data || []
  } catch (err) {
    error.value = '获取歌曲列表失败'
    console.error('获取歌曲列表错误:', err)
  } finally {
    loadingSongs.value = false
  }
}

const toggleSongSelection = (songId) => {
  const index = selectedSongsToAdd.value.indexOf(songId)
  if (index > -1) {
    selectedSongsToAdd.value.splice(index, 1)
  } else {
    selectedSongsToAdd.value.push(songId)
  }
}

const addSelectedSongsToPlaylist = async () => {
  if (selectedSongsToAdd.value.length === 0) {
    return
  }
  
  try {
    for (const songId of selectedSongsToAdd.value) {
      await playlistAPI.addSong(selectedPlaylist.value.id, songId)
    }
    
    showSongSelector.value = false
    selectedSongsToAdd.value = []
    
    await fetchPlaylistSongs(selectedPlaylist.value.id)
  } catch (err) {
    error.value = '添加歌曲失败'
    console.error('添加歌曲错误:', err)
  }
}

const removeSong = async (songId) => {
  if (!confirm('确定要从歌单中移除这首歌曲吗？')) {
    return
  }
  
  try {
    await playlistAPI.removeSong(selectedPlaylist.value.id, songId)
    await fetchPlaylistSongs(selectedPlaylist.value.id)
  } catch (err) {
    error.value = '移除歌曲失败'
    console.error('移除歌曲错误:', err)
  }
}

const deletePlaylist = async (playlistId) => {
  if (!confirm('确定要删除这个歌单吗？此操作不可恢复。')) {
    return
  }
  
  try {
    await playlistAPI.deletePlaylist(playlistId)
    await fetchPlaylists()
    if (selectedPlaylist.value && selectedPlaylist.value.id === playlistId) {
      selectedPlaylist.value = null
    }
  } catch (err) {
    error.value = '删除歌单失败'
    console.error('删除歌单错误:', err)
  }
}

const playSong = (song) => {
  router.push({ name: 'Player', params: { id: song.id } })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.playlist {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.playlist-container {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.playlist-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%);
}

.hero-section {
  text-align: center;
  padding: 60px 40px;
  margin-bottom: 50px;
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
  background: radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%);
  animation: rotate 30s linear infinite;
}

.hero-title {
  font-size: 56px;
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

.create-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.create-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.5);
}

.create-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.create-form h3 {
  margin-bottom: 20px;
  color: #333;
}

.playlist-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background-color: white;
  color: #333;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #42b883;
  background-color: white;
  color: #333;
}

.cover-upload-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
  position: relative;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-upload-zone:hover {
  border-color: #42b883;
  background-color: #f0f0f0;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-preview img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.remove-cover-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.remove-cover-btn:hover {
  background: rgba(255, 68, 68, 0.9);
  transform: scale(1.1);
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cover-icon {
  font-size: 36px;
  margin-bottom: 5px;
  transition: transform 0.3s ease;
}

.cover-upload-zone:hover .cover-icon {
  transform: scale(1.1);
}

.cover-info {
  color: #999;
  font-size: 12px;
}

.error-message {
  color: #ff4444;
  background-color: #ffeeee;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.submit-btn {
  flex: 1;
  padding: 12px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #349268;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 12px 20px;
  background-color: #999;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.cancel-btn:hover {
  background-color: #777;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.add-songs-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-songs-btn:hover {
  background-color: #349268;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.playlist-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.playlist-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
}

.playlist-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.playlist-card:hover .playlist-cover {
  transform: scale(1.1);
}

.playlist-info {
  padding: 15px;
}

.playlist-info h4 {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.playlist-desc {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

.playlist-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.song-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.created-date {
  font-size: 12px;
  color: #999;
}

.playlist-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.delete-playlist-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.delete-playlist-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.playlist-detail {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 20px;
}

.playlist-title-section {
  flex: 1;
  text-align: center;
}

.playlist-title-section h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.playlist-title-section p {
  margin: 0;
  color: #666;
}

.back-btn {
  padding: 8px 16px;
  background-color: #999;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.back-btn:hover {
  background-color: #777;
}

.add-songs-btn {
  padding: 8px 16px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.add-songs-btn:hover {
  background-color: #349268;
}

.detail-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.detail-header p {
  margin: 0;
  color: #666;
}

.playlist-songs {
  list-style: none;
  padding: 0;
  margin: 0;
}

.playlist-song-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

.playlist-song-item:hover {
  background-color: #f9f9f9;
}

.playlist-song-item .song-info {
  flex: 1;
}

.playlist-song-item .song-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.playlist-song-item .song-info p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.song-genre {
  display: inline-block;
  background-color: #e0e0e0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #666;
}

.song-actions {
  display: flex;
  gap: 10px;
}

.play-btn {
  padding: 6px 12px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.play-btn:hover {
  background-color: #349268;
}

.remove-btn {
  padding: 6px 12px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.remove-btn:hover {
  background-color: #cc0000;
}

/* 歌曲选择弹窗样式 */
.song-selector-content {
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.song-selector-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.song-selector-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.song-selector-item:hover {
  background-color: #f9f9f9;
}

.song-selector-item.selected {
  background-color: #e8f5e8;
}

.song-selector-info {
  flex: 1;
}

.song-selector-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.song-selector-info p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.song-selector-check {
  display: flex;
  align-items: center;
}

.song-selector-check input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.song-selector-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 0;
  border-top: 1px solid #e0e0e0;
}

.add-btn {
  padding: 12px 24px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.add-btn:hover:not(:disabled) {
  background-color: #349268;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .playlist-page {
    padding: 15px;
    padding-top: 70px;
  }
  
  .hero-title {
    font-size: 24px;
  }
  
  .hero-subtitle {
    font-size: 13px;
  }
  
  .playlists-section {
    padding: 20px 15px;
    border-radius: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .section-header h3 {
    font-size: 18px;
  }
  
  .create-btn {
    width: 100%;
    padding: 12px;
  }
  
  .playlists-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .playlist-card {
    border-radius: 12px;
  }
  
  .playlist-cover {
    height: 120px;
  }
  
  .playlist-info {
    padding: 12px;
  }
  
  .playlist-name {
    font-size: 15px;
  }
  
  .playlist-desc {
    font-size: 12px;
  }
  
  .playlist-detail {
    padding: 15px;
    border-radius: 16px;
  }
  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .detail-cover {
    width: 100%;
    height: 200px;
  }
  
  .detail-info {
    width: 100%;
  }
  
  .detail-title {
    font-size: 20px;
  }
  
  .detail-desc {
    font-size: 13px;
  }
  
  .playlist-song-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }
  
  .song-info {
    width: 100%;
  }
  
  .song-info h4 {
    font-size: 14px;
  }
  
  .song-info p {
    font-size: 12px;
  }
  
  .song-actions {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
  
  .play-btn, .remove-btn {
    width: 100%;
    padding: 10px;
  }
  
  .modal-content {
    padding: 20px;
    margin: 15px;
  }
  
  .modal-header h3 {
    font-size: 18px;
  }
  
  .form-input, .form-textarea {
    padding: 12px;
    font-size: 15px;
  }
  
  .submit-btn {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .playlist-page {
    padding: 10px;
    padding-top: 65px;
  }
  
  .hero-title {
    font-size: 20px;
  }
  
  .playlists-section {
    padding: 15px 10px;
  }
  
  .playlist-cover {
    height: 100px;
  }
}
</style>
