<template>
  <div class="comments-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="comments-header">
      <h3>💬 评论</h3>
      <span class="comment-count">{{ comments.length }} 条评论</span>
    </div>
    
    <!-- 评论输入 -->
    <div class="comment-input-section">
      <div class="user-avatar">
        <span>👤</span>
      </div>
      <div class="input-wrapper">
        <div v-if="replyingTo" class="reply-indicator">
          <span>回复 {{ replyingTo.user_name }}</span>
          <button @click="cancelReply" class="cancel-reply-btn">✕</button>
        </div>
        <textarea 
          v-model="newComment"
          :placeholder="replyingTo ? `回复 ${replyingTo.user_name}...` : '写下你的评论...'"
          class="comment-input"
          rows="3"
          @keydown.enter.exact.prevent="submitComment"
        ></textarea>
        <div class="input-actions">
          <button @click="submitComment" class="submit-btn" :disabled="!newComment.trim()">
            <span>✓</span>
            <span>{{ replyingTo ? '回复' : '发布' }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载评论中...</p>
    </div>
    
    <div v-else-if="comments.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <p>暂无评论，快来抢沙发吧！</p>
    </div>
    
    <div v-else class="comments-list">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
      >
        <div class="comment-avatar">
          <span>{{ comment.user_avatar || '👤' }}</span>
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-user">{{ comment.user_name }}</span>
            <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
          </div>
          <p class="comment-text">{{ comment.content }}</p>
          <div class="comment-actions">
            <button @click="likeComment(comment.id)" class="like-btn" :class="{ 'liked': comment.is_liked }">
              <span>👍</span>
              <span>{{ comment.like_count }}</span>
            </button>
            <button @click="replyComment(comment.id)" class="reply-btn">
              <span>↩️</span>
              <span>回复</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMore" class="load-more-btn">
        <span>↓</span>
        <span>加载更多评论</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { songAPI } from '@/api'

const props = defineProps({
  songId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['reply'])

const isDarkMode = ref(false)
const comments = ref([])
const newComment = ref('')
const loading = ref(true)
const hasMore = ref(true)
const page = ref(1)
const replyingTo = ref(null)
const replyContent = ref('')

const fetchComments = async () => {
  try {
    loading.value = true
    console.log('Fetching comments for songId:', props.songId)
    const response = await songAPI.getComments(props.songId, { page: page.value, limit: 10 })
    console.log('Comments response:', response)
    if (page.value === 1) {
      comments.value = response.data || []
    } else {
      comments.value = [...comments.value, ...(response.data || [])]
    }
    hasMore.value = response.data?.length >= 10
  } catch (error) {
    console.error('获取评论失败:', error)
    comments.value = []
  } finally {
    loading.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    console.log('Submitting comment for songId:', props.songId)
    const response = await songAPI.addComment(props.songId, { content: newComment.value })
    console.log('Comment response:', response)
    newComment.value = ''
    await fetchComments()
  } catch (error) {
    console.error('发表评论失败:', error)
    alert('发表评论失败，请稍后重试')
  }
}

const likeComment = async (commentId) => {
  try {
    await songAPI.likeComment(commentId)
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.is_liked = !comment.is_liked
      comment.like_count += comment.is_liked ? 1 : -1
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const replyComment = (comment) => {
  replyingTo.value = comment
  newComment.value = ''
}

const cancelReply = () => {
  replyingTo.value = null
  newComment.value = ''
}

const loadMore = async () => {
  page.value++
  await fetchComments()
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
  return date.toLocaleDateString()
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
  }
  fetchComments()
})
</script>

<style scoped>
.comments-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dark-mode .comments-container {
  background-color: #2a2a2a;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.comments-header h3 {
  margin: 0;
  font-size: 22px;
  color: #333;
}

.dark-mode .comments-header h3 {
  color: #fff;
}

.comment-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.dark-mode .comment-count {
  color: #999;
}

.comment-input-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
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
}

.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: all 0.2s ease;
  background-color: white;
  font-family: inherit;
  color: #333;
}

.comment-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dark-mode .comment-input {
  background-color: #3a3a3a;
  border-color: #444;
  color: #e0e0e0;
}

.dark-mode .comment-input:focus {
  border-color: #667eea;
  background-color: #3a3a3a;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

.reply-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.cancel-reply-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s ease;
}

.cancel-reply-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.submit-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
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
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.dark-mode .empty-state {
  color: #999;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.comment-item:hover {
  background-color: #f0f0f0;
  transform: translateX(5px);
}

.dark-mode .comment-item {
  background-color: #333;
}

.dark-mode .comment-item:hover {
  background-color: #3a3a3a;
}

.comment-avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-user {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.dark-mode .comment-user {
  color: #fff;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dark-mode .comment-text {
  color: #ccc;
}

.comment-actions {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.like-btn,
.reply-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  color: #666;
}

.dark-mode .like-btn,
.dark-mode .reply-btn {
  background: #333;
  border-color: #444;
  color: #ccc;
}

.like-btn:hover,
.reply-btn:hover {
  background-color: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.dark-mode .like-btn:hover,
.dark-mode .reply-btn:hover {
  background-color: #444;
  border-color: #667eea;
  color: #667eea;
}

.like-btn.liked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.load-more-btn {
  padding: 12px 30px;
  background: transparent;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.load-more-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-input-section {
    flex-direction: column;
  }
  
  .comment-item {
    flex-direction: column;
    gap: 10px;
  }
  
  .comment-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>