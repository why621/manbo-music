<template>
  <div class="lyrics-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="lyrics-header">
      <h3>📝 歌词</h3>
      <button @click="closeLyrics" class="close-btn">✕</button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载歌词中...</p>
    </div>
    
    <div v-else-if="!lyrics || lyrics.length === 0" class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>暂无歌词</p>
    </div>
    
    <div v-else class="lyrics-content">
      <div 
        v-for="(line, index) in lyrics" 
        :key="index"
        class="lyric-line"
        :class="{ 'active': currentLine === index }"
        @click="seekToLine(index)"
      >
        {{ line.text }}
      </div>
    </div>
    
    <div class="lyrics-footer">
      <button @click="toggleAutoScroll" class="auto-scroll-btn" :class="{ 'active': autoScroll }">
        <span>{{ autoScroll ? '🔒' : '🔓' }}</span>
        <span>{{ autoScroll ? '锁定滚动' : '自动滚动' }}</span>
      </button>
      <button @click="toggleFontSize" class="font-size-btn">
        <span>Aa</span>
        <span>{{ fontSize }}px</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { songAPI } from '@/api'

const props = defineProps({
  songId: {
    type: String,
    required: true
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'seek'])

const isDarkMode = ref(false)
const lyrics = ref([])
const loading = ref(true)
const autoScroll = ref(true)
const fontSize = ref(16)
const currentLine = ref(0)

const fetchLyrics = async () => {
  try {
    loading.value = true
    const response = await songAPI.getLyrics(props.songId)
    lyrics.value = response.data || []
  } catch (error) {
    console.error('获取歌词失败:', error)
    lyrics.value = []
  } finally {
    loading.value = false
  }
}

const closeLyrics = () => {
  emit('close')
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
}

const toggleFontSize = () => {
  const sizes = [14, 16, 18, 20, 22]
  const currentIndex = sizes.indexOf(fontSize.value)
  const nextIndex = (currentIndex + 1) % sizes.length
  fontSize.value = sizes[nextIndex]
}

const seekToLine = (index) => {
  if (lyrics.value[index] && lyrics.value[index].time) {
    emit('seek', lyrics.value[index].time)
  }
}

const updateCurrentLine = () => {
  if (!autoScroll.value) return
  
  let closestLine = 0
  let minDiff = Math.abs(props.currentTime - (lyrics.value[0]?.time || 0))
  
  for (let i = 1; i < lyrics.value.length; i++) {
    const diff = Math.abs(props.currentTime - (lyrics.value[i]?.time || 0))
    if (diff < minDiff) {
      minDiff = diff
      closestLine = i
    }
  }
  
  currentLine.value = closestLine
}

watch(() => props.songId, () => {
  if (props.songId) {
    fetchLyrics()
  }
})

watch(() => props.currentTime, () => {
  updateCurrentLine()
})
</script>

<style scoped>
.lyrics-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.lyrics-container.dark-mode {
  background: #1a1a1a;
}

.lyrics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.lyrics-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.dark-mode .lyrics-header h3 {
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
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

.dark-mode .close-btn:hover {
  background-color: #333;
  color: #fff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  flex: 1;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  flex: 1;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  color: #666;
  font-size: 14px;
}

.dark-mode .empty-state p {
  color: #999;
}

.lyrics-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 20px;
  text-align: center;
}

.lyric-line {
  padding: 12px 0;
  font-size: 16px;
  color: #666;
  line-height: 1.8;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
}

.lyric-line:hover {
  background-color: #f5f5f5;
  color: #333;
}

.dark-mode .lyric-line:hover {
  background-color: #333;
  color: #fff;
}

.lyric-line.active {
  color: #667eea;
  font-weight: 600;
  font-size: 18px;
  background-color: rgba(102, 126, 234, 0.05);
}

.dark-mode .lyric-line.active {
  color: #42b883;
  background-color: rgba(66, 184, 131, 0.05);
}

.lyrics-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
}

.auto-scroll-btn,
.font-size-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.auto-scroll-btn:hover,
.font-size-btn:hover {
  background: #e0e0e0;
  border-color: #667eea;
}

.auto-scroll-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.dark-mode .auto-scroll-btn,
.dark-mode .font-size-btn {
  background: #333;
  border-color: #444;
}

.dark-mode .auto-scroll-btn:hover,
.dark-mode .font-size-btn:hover {
  background: #444;
  border-color: #667eea;
}

.dark-mode .auto-scroll-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .lyrics-container {
    width: 100%;
    transform: translateX(100%);
  }
  
  .lyrics-container.show {
    transform: translateX(0);
  }
}
</style>