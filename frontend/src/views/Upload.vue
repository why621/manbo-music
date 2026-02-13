<template>
  <div class="upload">
    <div class="upload-container">
      <div class="hero-section">
        <h2 class="hero-title">🎵 上传音乐</h2>
        <p class="hero-subtitle">分享你的音乐作品</p>
      </div>
      
      <form @submit.prevent="handleUpload" class="upload-form">
        <!-- 文件选择 -->
        <div class="form-group">
          <label for="audioFile">音频文件 *</label>
          <div class="file-drop-zone" 
               :class="{ 'drag-over': isDragOver }"
               @click="triggerFileSelect"
               @dragover.prevent="isDragOver = true"
               @dragleave.prevent="isDragOver = false"
               @drop.prevent="handleDrop">
            <input 
              type="file" 
              id="audioFile" 
              ref="fileInput"
              @change="handleFileSelect"
              accept="audio/*"
              required
              style="display: none"
            >
            <div class="file-drop-content">
              <div class="upload-icon">📁</div>
              <p>点击或拖拽音频文件到此处</p>
              <p class="file-info">{{ fileName || '支持格式: MP3, WAV, OGG, M4A, FLAC' }}</p>
              <p class="file-limit">最大文件大小: 50MB</p>
            </div>
          </div>
        </div>
        
        <!-- 封面图片 -->
        <div class="form-group">
          <label for="coverFile">封面图片</label>
          <div class="cover-upload-zone" @click="triggerCoverSelect">
            <input 
              type="file" 
              id="coverFile" 
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
        
        <!-- 歌曲信息 -->
        <div class="song-info-section">
          <div class="section-header">
            <h3>📝 歌曲信息</h3>
            <div class="section-divider"></div>
          </div>
          
          <div class="form-group">
            <label for="title">歌曲标题</label>
            <input 
              type="text" 
              id="title" 
              v-model="formData.title" 
              placeholder="自动从文件名提取"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="artist">歌手</label>
            <input 
              type="text" 
              id="artist" 
              v-model="formData.artist" 
              placeholder="请输入歌手名称"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="album">专辑</label>
            <input 
              type="text" 
              id="album" 
              v-model="formData.album" 
              placeholder="请输入专辑名称"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="genre">音乐流派</label>
            <select id="genre" v-model="formData.genre" class="form-select">
              <option value="">选择流派</option>
              <option value="Pop">流行音乐</option>
              <option value="Rock">摇滚</option>
              <option value="Jazz">爵士</option>
              <option value="Classical">古典</option>
              <option value="Electronic">电子</option>
              <option value="Hip Hop">嘻哈</option>
              <option value="R&B">R&B</option>
              <option value="Country">乡村</option>
              <option value="Blues">蓝调</option>
              <option value="Other">其他</option>
            </select>
          </div>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="error" class="error-message">
          <span>⚠️</span>
          <span>{{ error }}</span>
        </div>
        
        <!-- 上传进度 -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-header">
            <span>上传中...</span>
            <span class="progress-percentage">{{ uploadProgress }}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>
        
        <!-- 提交按钮 -->
        <button type="submit" class="upload-btn" :disabled="!selectedFile || uploading">
          <span v-if="uploading" class="loading-spinner"></span>
          <span>{{ uploading ? '上传中...' : '上传歌曲' }}</span>
        </button>
      </form>
      
      <!-- 上传成功 -->
      <transition name="success">
        <div v-if="uploadSuccess" class="success-message">
          <div class="success-icon">✅</div>
          <h3>上传成功！</h3>
          <p>歌曲 "{{ uploadSuccess.title }}" 已成功上传</p>
          <button @click="resetForm" class="reset-btn">继续上传</button>
        </div>
      </transition>
    </div>
    
    <!-- 已上传的歌曲列表 -->
    <div class="uploaded-songs-section">
      <div class="section-header">
        <h3>📋 已上传的歌曲</h3>
        <div class="section-divider"></div>
      </div>
      <div v-if="loadingUploads" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="uploadedSongs.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <p>暂无上传的歌曲</p>
      </div>
      <ul v-else class="uploaded-list">
        <li v-for="song in uploadedSongs" :key="song.id" class="uploaded-item">
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
            <button @click="deleteSong(song.id)" class="delete-btn">
              <span>🗑</span>
              <span>删除</span>
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { uploadAPI } from '@/api'

const router = useRouter()
const formData = ref({
  title: '',
  artist: '',
  album: '',
  genre: ''
})
const selectedFile = ref(null)
const selectedCover = ref(null)
const fileName = ref('')
const coverPreview = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const uploadSuccess = ref(null)
const loadingUploads = ref(true)
const uploadedSongs = ref([])
const isDragOver = ref(false)
const fileInput = ref(null)
const coverInput = ref(null)

onMounted(() => {
  fetchUploadedSongs()
})

const fetchUploadedSongs = async () => {
  try {
    loadingUploads.value = true
    const response = await uploadAPI.getUploads()
    uploadedSongs.value = (response.data || []).map(song => {
      if (song.cover && song.cover.startsWith('/')) {
        song.cover = window.location.origin + song.cover
      }
      if (song.url && song.url.startsWith('/')) {
        song.url = window.location.origin + song.url
      }
      return song
    })
  } catch (err) {
    console.error('获取上传歌曲失败:', err)
  } finally {
    loadingUploads.value = false
  }
}

const handleFileSelect = (event) => {
  console.log('handleFileSelect called', event.target.files)
  const file = event.target.files[0]
  if (file) {
    console.log('File selected:', file.name, file.type, file.size)
    validateAndSetFile(file)
  }
}

const triggerFileSelect = () => {
  console.log('triggerFileSelect called', fileInput.value)
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleDrop = (event) => {
  console.log('handleDrop called')
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    console.log('File dropped:', file.name, file.type, file.size)
    validateAndSetFile(file)
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
    
    selectedCover.value = file
    
    const reader = new FileReader()
    reader.onload = (e) => {
      coverPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    error.value = ''
  }
}

const removeCover = () => {
  selectedCover.value = null
  coverPreview.value = ''
  if (coverInput.value) {
    coverInput.value.value = ''
  }
}

const validateAndSetFile = (file) => {
  console.log('validateAndSetFile called:', file)
  // 检查文件类型
  if (!file.type.startsWith('audio/')) {
    error.value = '请选择音频文件'
    console.log('Invalid file type:', file.type)
    return
  }
  
  // 检查文件大小（50MB）
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    error.value = '文件大小超过50MB限制'
    console.log('File too large:', file.size)
    return
  }
  
  selectedFile.value = file
  fileName.value = file.name
  console.log('File set successfully:', fileName.value)
  
  // 如果没有设置标题，使用文件名
  if (!formData.value.title) {
    formData.value.title = file.name.replace(/\.[^/.]+$/, '')
  }
  
  error.value = ''
}

const handleUpload = async () => {
  console.log('handleUpload called', selectedFile.value)
  if (!selectedFile.value) {
    error.value = '请选择音频文件'
    console.log('No file selected')
    return
  }
  
  try {
    uploading.value = true
    error.value = ''
    uploadProgress.value = 0
    
    const formDataToSend = new FormData()
    formDataToSend.append('audio', selectedFile.value)
    formDataToSend.append('title', formData.value.title)
    formDataToSend.append('artist', formData.value.artist)
    formDataToSend.append('album', formData.value.album)
    formDataToSend.append('genre', formData.value.genre)
    
    if (selectedCover.value) {
      formDataToSend.append('cover', selectedCover.value)
    }
    
    console.log('Uploading file:', selectedFile.value.name)
    console.log('FormData:', formDataToSend)
    
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 10
      }
    }, 200)
    
    const response = await uploadAPI.uploadSong(formDataToSend)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    uploadSuccess.value = response.data
    
    console.log('Upload successful:', response.data)
    
    await fetchUploadedSongs()
  } catch (err) {
    clearInterval(progressInterval)
    error.value = err.response?.data?.error || '上传失败，请稍后重试'
    console.error('上传错误:', err)
    console.error('Error response:', err.response?.data)
  } finally {
    uploading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    artist: '',
    album: '',
    genre: ''
  }
  selectedFile.value = null
  selectedCover.value = null
  fileName.value = ''
  coverPreview.value = ''
  uploadSuccess.value = null
  uploadProgress.value = 0
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  if (coverInput.value) {
    coverInput.value.value = ''
  }
}

const playSong = (song) => {
  router.push({ name: 'Player', params: { id: song.id } })
}

const deleteSong = async (songId) => {
  if (!confirm('确定要删除这首歌曲吗？')) {
    return
  }
  
  try {
    await uploadAPI.deleteSong(songId)
    await fetchUploadedSongs()
  } catch (err) {
    error.value = '删除失败，请稍后重试'
    console.error('删除错误:', err)
  }
}
</script>

<style scoped>
.upload {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.upload-container {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-radius: 30px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  padding: 40px;
  margin-bottom: 40px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.upload-container::before {
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
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin-bottom: 40px;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-input, .form-select {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  outline: none;
  background-color: white;
  color: #333;
}

.form-input:focus, .form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background-color: white;
  color: #333;
}

.file-drop-zone {
  border: 3px dashed #e0e0e0;
  border-radius: 24px;
  padding: 60px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
}

.file-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 72px;
  margin-bottom: 10px;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.2));
}

.file-drop-zone:hover .upload-icon {
  transform: scale(1.15) rotate(5deg);
}

.file-info {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.file-limit {
  color: #999;
  font-size: 12px;
}

.cover-upload-zone {
  border: 3px dashed #e0e0e0;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  position: relative;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.cover-upload-zone:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
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
  max-height: 220px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.cover-preview img:hover {
  transform: scale(1.05);
}

.remove-cover-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
  gap: 12px;
}

.cover-icon {
  font-size: 48px;
  margin-bottom: 10px;
  transition: transform 0.3s ease;
}

.cover-upload-zone:hover .cover-icon {
  transform: scale(1.1);
}

.cover-info {
  color: #999;
  font-size: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 22px;
  color: #333;
  font-weight: 600;
}

.section-divider {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%);
  margin-left: 20px;
}

.song-info-section {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background-color: #fee;
  border: 1px solid #ff4444;
  border-radius: 8px;
  color: #ff4444;
  font-size: 14px;
  font-weight: 500;
}

.upload-progress {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.progress-percentage {
  color: #667eea;
  font-weight: 700;
}

.progress-bar-container {
  background-color: #e0e0e0;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  transition: width 0.3s ease;
}

.upload-btn {
  width: 100%;
  padding: 16px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-enter-active,
.success-leave-active {
  transition: opacity 0.3s ease;
}

.success-enter-from,
.success-leave-to {
  opacity: 0;
}

.success-message {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.success-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.success-message h3 {
  color: #667eea;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px 0;
}

.success-message p {
  color: #666;
  font-size: 16px;
  margin: 0 0 20px 0;
}

.reset-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.uploaded-songs-section {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-radius: 30px;
  padding: 40px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.uploaded-songs-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%);
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

.uploaded-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.uploaded-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin-bottom: 5px;
}

.uploaded-item:hover {
  background-color: #f9f9f9;
  transform: translateX(5px);
}

.uploaded-item .song-info {
  flex: 1;
}

.uploaded-item .song-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.uploaded-item .song-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.song-genre {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: white;
  font-weight: 500;
}

.song-actions {
  display: flex;
  gap: 10px;
}

.play-btn, .delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
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

.delete-btn {
  background-color: #ff4444;
  color: white;
}

.delete-btn:hover {
  background-color: #cc0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload {
    padding: 15px;
    padding-top: 70px;
  }
  
  .hero-title {
    font-size: 24px;
  }
  
  .hero-subtitle {
    font-size: 13px;
  }
  
  .upload-container {
    padding: 20px 15px;
    border-radius: 16px;
    margin-bottom: 20px;
  }
  
  .upload-header h2 {
    font-size: 20px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    font-size: 14px;
  }
  
  .form-input, .form-select, .form-textarea {
    padding: 12px 14px;
    font-size: 15px;
  }
  
  .upload-zone {
    padding: 30px 15px;
    border-radius: 12px;
  }
  
  .upload-icon {
    font-size: 40px;
  }
  
  .upload-text {
    font-size: 14px;
  }
  
  .upload-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
  
  .uploaded-songs-section {
    padding: 20px 15px;
    border-radius: 16px;
  }
  
  .section-header h3 {
    font-size: 18px;
  }
  
  .uploaded-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 15px;
  }
  
  .song-info {
    width: 100%;
  }
  
  .song-info h4 {
    font-size: 15px;
  }
  
  .song-info p {
    font-size: 13px;
  }
  
  .song-actions {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
  
  .play-btn, .delete-btn {
    width: 100%;
    padding: 12px;
  }
  
  .cover-upload-zone {
    height: 150px;
  }
  
  .cover-icon {
    font-size: 36px;
  }
  
  .success-message {
    padding: 20px;
  }
  
  .success-message h3 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .upload {
    padding: 10px;
    padding-top: 65px;
  }
  
  .hero-title {
    font-size: 20px;
  }
  
  .upload-container {
    padding: 15px 10px;
  }
  
  .upload-zone {
    padding: 20px 10px;
  }
  
  .upload-icon {
    font-size: 32px;
  }
}
</style>
