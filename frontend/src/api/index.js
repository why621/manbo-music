import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器（带重试机制）
api.interceptors.response.use(
  response => {
    return response.data
  },
  async error => {
    const originalRequest = error.config
    
    // 如果没有配置或已经重试过，直接返回错误
    if (!originalRequest || originalRequest._retryCount >= MAX_RETRIES) {
      console.error('API Error:', error.response?.data || error.message)
      return Promise.reject(error)
    }
    
    // 初始化重试计数
    originalRequest._retryCount = originalRequest._retryCount || 0
    
    // 如果是网络错误或5xx错误，进行重试
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
      originalRequest._retryCount++
      console.log(`Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`)
      await delay(RETRY_DELAY * originalRequest._retryCount)
      return api(originalRequest)
    }
    
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// 基础API
export const healthAPI = {
  // 获取服务器状态
  getStatus: async () => {
    const response = await api.get('/health')
    return response
  },
  
  // 检查数据库连接
  checkDB: async () => {
    try {
      const response = await api.get('/health/db')
      return { connected: true, message: '数据库连接正常' }
    } catch (error) {
      return { connected: false, error: error.message }
    }
  },
  
  // 检查Redis连接
  checkRedis: async () => {
    try {
      const response = await api.get('/health/redis')
      return { connected: true, message: 'Redis连接正常' }
    } catch (error) {
      return { connected: false, error: error.message }
    }
  }
}

// 用户API
export const userAPI = {
  login: (data) => api.post('/users/login', data),
  register: (data) => api.post('/users/register', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
}

// 歌曲API
export const songAPI = {
  getList: (params) => api.get('/songs', { params }),
  getById: (id) => api.get(`/songs/${id}`),
  search: (keyword) => api.get(`/songs/search?q=${keyword}`),
  getComments: (songId, params) => api.get(`/comments/songs/${songId}`, { params }),
  addComment: (songId, data) => api.post(`/comments/songs/${songId}`, data),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  getHistory: (params) => api.get('/history', { params }),
  addToHistory: (data) => api.post('/history', data),
  deleteHistory: (historyId) => api.delete(`/history/${historyId}`),
  clearHistory: () => api.delete('/history'),
  download: (songId) => {
    const url = `http://localhost:8080/api/v1/songs/${songId}/download`
    const link = document.createElement('a')
    link.href = url
    link.download = `song_${songId}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 歌单API
export const playlistAPI = {
  getList: () => api.get('/playlists'),
  getById: (id) => api.get(`/playlists/${id}`),
  create: (formData) => {
    if (formData instanceof FormData) {
      return api.post('/playlists', formData)
    }
    return api.post('/playlists', formData)
  },
  addSong: (playlistId, songId) => api.post(`/playlists/${playlistId}/songs/${songId}`),
  removeSong: (playlistId, songId) => api.delete(`/playlists/${playlistId}/songs/${songId}`),
  deletePlaylist: (id) => api.delete(`/playlists/${id}`)
}

// 播放器API
export const playerAPI = {
  play: (songId) => api.post('/player/play', { song_id: songId }),
  pause: () => api.post('/player/pause'),
  getQueue: () => api.get('/player/queue'),
  addToQueue: (songId) => api.post('/player/queue/add', { song_id: songId })
}

// 上传API
export const uploadAPI = {
  uploadSong: (formData) => {
    return api.post('/upload/song', formData, {
      timeout: 60000,
      headers: {
        'Content-Type': undefined
      }
    })
  },
  getUploads: () => api.get('/upload/songs'),
  deleteSong: (id) => api.delete(`/upload/song/${id}`)
}

export default api
