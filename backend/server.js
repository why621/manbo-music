import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parseFile } from 'music-metadata'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 8080

// 错误处理中间件
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  })
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

const songs = []
const uploadedSongs = []

const playlists = [
  {
    id: 1,
    name: '我喜欢的音乐',
    description: '收藏喜欢的歌曲',
    song_count: 0,
    user_id: null
  },
  {
    id: 2,
    name: '工作背景音乐',
    description: '适合工作时听的音乐',
    song_count: 0,
    user_id: null
  }
]

const history = []
const comments = []
const playlistSongs = []

const users = []

const generateToken = () => {
  return 'token-' + Math.random().toString(36).substr(2) + Date.now()
}

const verifyToken = (token) => {
  if (!token) return null
  return users.find(u => u.token === token)
}

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const user = verifyToken(token)
  
  if (!user) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' })
  }
  
  req.user = user
  next()
}

// 简单的内存缓存
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

const getCache = (key) => {
  const item = cache.get(key)
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data
  }
  cache.delete(key)
  return null
}

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() })
}

// 清理过期缓存
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      cache.delete(key)
    }
  }
}, 60 * 1000) // 每分钟清理一次

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' })
})

app.get('/api/v1/health/db', (req, res) => {
  res.json({ connected: true, message: '数据库连接正常' })
})

app.get('/api/v1/health/redis', (req, res) => {
  res.json({ connected: true, message: 'Redis连接正常' })
})

app.post('/api/v1/users/login', (req, res) => {
  const { username, password } = req.body
  
  const user = users.find(u => u.username === username && u.password === password)
  
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }
  
  const token = generateToken()
  user.token = token
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    }
  })
})

app.post('/api/v1/users/register', (req, res) => {
  const { username, password, email } = req.body
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
  }
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: '用户名已存在' })
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    password,
    email: email || '',
    avatar: '',
    token: null,
    created_at: new Date().toISOString()
  }
  
  users.push(newUser)
  
  const token = generateToken()
  newUser.token = token
  
  res.json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar
      }
    }
  })
})

app.get('/api/v1/users/profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar
    }
  })
})

app.put('/api/v1/users/profile', authMiddleware, (req, res) => {
  const { avatar } = req.body
  
  if (avatar !== undefined) {
    req.user.avatar = avatar
  }
  
  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar
    }
  })
})

app.get('/api/v1/songs', asyncHandler(async (req, res) => {
  const { limit, order } = req.query
  const cacheKey = `songs:${limit || 'all'}:${order || 'default'}`
  
  const cached = getCache(cacheKey)
  if (cached) {
    return res.json({ success: true, data: cached, cached: true })
  }
  
  let result = [...songs]
  if (limit) {
    result = result.slice(0, parseInt(limit))
  }
  
  setCache(cacheKey, result)
  res.json({ success: true, data: result, cached: false })
}))

app.get('/api/v1/songs/search', asyncHandler(async (req, res) => {
  const { q } = req.query
  console.log('搜索请求 - q:', q)
  console.log('当前歌曲数量:', songs.length)
  console.log('所有歌曲:', JSON.stringify(songs, null, 2))
  
  if (!q || !q.trim()) {
    return res.json({ success: true, data: [] })
  }
  
  const cacheKey = `search:${q.trim().toLowerCase()}`
  
  const cached = getCache(cacheKey)
  if (cached) {
    console.log('返回缓存结果:', cached)
    return res.json({ success: true, data: cached, cached: true })
  }
  
  const query = q.trim().toLowerCase()
  console.log('搜索关键词:', query)
  
  const results = songs.filter(song => {
    const title = (song.title || '').toLowerCase()
    const artist = (song.artist || '').toLowerCase()
    const album = (song.album || '').toLowerCase()
    const genre = (song.genre || '').toLowerCase()
    
    console.log(`检查歌曲: ${song.title} - 标题匹配: ${title.includes(query)}, 歌手匹配: ${artist.includes(query)}`)
    
    return title.includes(query) || 
           artist.includes(query) ||
           album.includes(query) ||
           genre.includes(query)
  })
  
  console.log('搜索结果:', results)
  
  setCache(cacheKey, results)
  res.json({ success: true, data: results, cached: false })
}))

app.get('/api/v1/songs/:id', (req, res) => {
  const song = songs.find(s => s.id === parseInt(req.params.id))
  if (song) {
    res.json({ success: true, data: song })
  } else {
    res.status(404).json({ success: false, message: '歌曲不存在' })
  }
})

app.get('/api/v1/songs/:id/download', (req, res) => {
  const song = songs.find(s => s.id === parseInt(req.params.id))
  if (song && song.filename) {
    const filePath = `${__dirname}/uploads/${song.filename}`
    res.download(filePath, `${song.title}.mp3`)
  } else {
    res.status(404).json({ success: false, message: '歌曲不存在' })
  }
})

app.get('/api/v1/playlists', authMiddleware, asyncHandler(async (req, res) => {
  const cacheKey = `playlists:${req.user.id}`
  
  const cached = getCache(cacheKey)
  if (cached) {
    return res.json({ success: true, data: cached, cached: true })
  }
  
  const userPlaylists = playlists.filter(p => p.user_id === req.user.id || p.user_id === null)
  setCache(cacheKey, userPlaylists)
  res.json({ success: true, data: userPlaylists, cached: false })
}))

app.get('/api/v1/playlists/:id', authMiddleware, (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.id))
  if (playlist && (playlist.user_id === req.user.id || playlist.user_id === null)) {
    const songsInPlaylist = playlistSongs.filter(ps => ps.playlist_id === playlist.id).map(ps => {
      const song = songs.find(s => s.id === ps.song_id)
      return song
    }).filter(s => s !== undefined)
    res.json({ success: true, data: { ...playlist, songs: songsInPlaylist } })
  } else {
    res.status(403).json({ success: false, message: '无权访问此歌单' })
  }
})

app.post('/api/v1/playlists', authMiddleware, upload.single('cover'), asyncHandler(async (req, res) => {
  const { name, description } = req.body
  const coverFile = req.file
  
  const newPlaylist = {
    id: playlists.length + 1,
    name,
    description,
    song_count: 0,
    cover: coverFile ? `/uploads/${coverFile.filename}` : 'https://picsum.photos/seed/' + Date.now() + '/300/300',
    created_at: new Date().toISOString(),
    user_id: req.user.id
  }
  playlists.push(newPlaylist)
  
  clearCache('playlists')
  
  res.json({ success: true, data: newPlaylist })
}))

app.post('/api/v1/playlists/:playlistId/songs/:songId', authMiddleware, asyncHandler(async (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.playlistId))
  const song = songs.find(s => s.id === parseInt(req.params.songId))
  
  if (!playlist || !song) {
    return res.status(404).json({ success: false, message: '歌单或歌曲不存在' })
  }
  
  if (playlist.user_id !== null && playlist.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: '无权操作此歌单' })
  }
  
  const existingRelation = playlistSongs.find(ps => 
    ps.playlist_id === playlist.id && ps.song_id === song.id
  )
  
  if (!existingRelation) {
    playlistSongs.push({
      id: playlistSongs.length + 1,
      playlist_id: playlist.id,
      song_id: song.id
    })
    playlist.song_count++
    
    clearCache('playlists')
  }
  res.json({ success: true, message: '添加成功' })
}))

app.delete('/api/v1/playlists/:playlistId/songs/:songId', authMiddleware, asyncHandler(async (req, res) => {
  const playlist = playlists.find(p => p.id === parseInt(req.params.playlistId))
  const songId = parseInt(req.params.songId)
  
  if (!playlist) {
    return res.status(404).json({ success: false, message: '歌单不存在' })
  }
  
  if (playlist.user_id !== null && playlist.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: '无权操作此歌单' })
  }
  
  if (playlist && playlist.song_count > 0) {
    const relationIndex = playlistSongs.findIndex(ps => 
      ps.playlist_id === playlist.id && ps.song_id === songId
    )
    
    if (relationIndex !== -1) {
      playlistSongs.splice(relationIndex, 1)
    }
    
    playlist.song_count--
    
    clearCache('playlists')
    
    res.json({ success: true, message: '删除成功' })
  } else {
    res.status(404).json({ success: false, message: '操作失败' })
  }
}))

app.delete('/api/v1/playlists/:id', authMiddleware, asyncHandler(async (req, res) => {
  const index = playlists.findIndex(p => p.id === parseInt(req.params.id))
  const playlist = playlists[index]
  
  if (index !== -1) {
    if (playlist.user_id !== null && playlist.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权删除此歌单' })
    }
    playlists.splice(index, 1)
    
    clearCache('playlists')
    
    res.json({ success: true, message: '删除成功' })
  } else {
    res.status(404).json({ success: false, message: '歌单不存在' })
  }
}))

app.get('/api/v1/history', authMiddleware, (req, res) => {
  const userHistory = history.filter(h => h.user_id === req.user.id)
  res.json({ success: true, data: userHistory })
})

app.post('/api/v1/history', authMiddleware, (req, res) => {
  const { song_id, song_title, song_artist, song_cover } = req.body
  const newHistory = {
    id: history.length + 1,
    song_id,
    song_title,
    song_artist,
    song_cover,
    user_id: req.user.id,
    played_at: new Date().toISOString()
  }
  history.unshift(newHistory)
  res.json({ success: true, data: newHistory })
})

app.delete('/api/v1/history/:id', authMiddleware, (req, res) => {
  const index = history.findIndex(h => h.id === parseInt(req.params.id))
  if (index !== -1) {
    const historyItem = history[index]
    if (historyItem.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '无权删除此记录' })
    }
    history.splice(index, 1)
    res.json({ success: true, message: '删除成功' })
  } else {
    res.status(404).json({ success: false, message: '记录不存在' })
  }
})

app.delete('/api/v1/history', authMiddleware, (req, res) => {
  const userHistory = history.filter(h => h.user_id === req.user.id)
  userHistory.forEach(h => {
    const index = history.indexOf(h)
    if (index !== -1) {
      history.splice(index, 1)
    }
  })
  res.json({ success: true, message: '清空成功' })
})

app.post('/api/v1/player/play', (req, res) => {
  res.json({ success: true, message: '播放成功' })
})

app.post('/api/v1/player/pause', (req, res) => {
  res.json({ success: true, message: '暂停成功' })
})

app.get('/api/v1/player/queue', (req, res) => {
  res.json({ success: true, data: songs })
})

app.post('/api/v1/player/queue/add', (req, res) => {
  res.json({ success: true, message: '添加到播放队列成功' })
})

app.get('/api/v1/comments/songs/:songId', (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const songComments = comments.filter(c => c.song_id === parseInt(req.params.songId))
  const start = (page - 1) * limit
  const end = start + parseInt(limit)
  const paginatedComments = songComments.slice(start, end)
  res.json({ success: true, data: paginatedComments })
})

app.post('/api/v1/comments/songs/:songId', (req, res) => {
  const { content } = req.body
  const newComment = {
    id: comments.length + 1,
    song_id: parseInt(req.params.songId),
    user_name: '用户' + Math.floor(Math.random() * 1000),
    user_avatar: '👤',
    content,
    like_count: 0,
    is_liked: false,
    created_at: new Date().toISOString()
  }
  comments.push(newComment)
  res.json({ success: true, data: newComment })
})

app.post('/api/v1/comments/:commentId/like', (req, res) => {
  const comment = comments.find(c => c.id === parseInt(req.params.commentId))
  if (comment) {
    comment.is_liked = !comment.is_liked
    comment.like_count += comment.is_liked ? 1 : -1
  }
  res.json({ success: true, data: comment })
})

const clearCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

const clearAllCache = () => {
  cache.clear()
}

app.post('/api/v1/upload/song', authMiddleware, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), asyncHandler(async (req, res) => {
  try {
    console.log('收到上传请求')
    console.log('Files:', req.files)
    console.log('Body:', req.body)
    
    if (!req.files || !req.files.audio) {
      console.log('错误：没有上传音频文件')
      return res.status(400).json({ success: false, message: '没有上传音频文件' })
    }
    
    const audioFile = req.files.audio[0]
    const coverFile = req.files.cover ? req.files.cover[0] : null
    
    const { title, artist, album, genre } = req.body
    
    let duration = 0
    try {
      const metadata = await parseFile(audioFile.path)
      duration = Math.round(metadata.format.duration || 0)
    } catch (err) {
      console.error('解析音频时长失败:', err)
    }
    
    const newSong = {
      id: songs.length + 1,
      title: title || audioFile.originalname.replace(/\.[^/.]+$/, ''),
      artist: artist || '未知歌手',
      album: album || '未知专辑',
      genre: genre || '其他',
      cover: coverFile ? `/uploads/${coverFile.filename}` : 'https://picsum.photos/seed/' + Date.now() + '/300/300',
      duration,
      filename: audioFile.filename,
      url: `/uploads/${audioFile.filename}`,
      user_id: req.user.id
    }
    
    songs.push(newSong)
    uploadedSongs.push(newSong)
    
    // 清除所有缓存
    clearAllCache()
    
    console.log('上传成功:', newSong)
    
    res.json({
      success: true,
      data: newSong
    })
  } catch (error) {
    console.error('上传错误:', error)
    res.status(500).json({ success: false, message: '上传失败: ' + error.message })
  }
}))

app.get('/api/v1/upload/songs', authMiddleware, asyncHandler(async (req, res) => {
  const cacheKey = `uploaded:songs:${req.user.id}`
  
  const cached = getCache(cacheKey)
  if (cached) {
    return res.json({ success: true, data: cached, cached: true })
  }
  
  const userSongs = uploadedSongs.filter(s => s.user_id === req.user.id)
  setCache(cacheKey, userSongs)
  res.json({ success: true, data: userSongs, cached: false })
}))

app.delete('/api/v1/upload/song/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const song = uploadedSongs.find(s => s.id === id)
  
  if (!song || song.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: '无权删除此歌曲' })
  }
  
  const uploadedIndex = uploadedSongs.findIndex(s => s.id === id)
  const songsIndex = songs.findIndex(s => s.id === id)
  
  if (uploadedIndex !== -1) {
    uploadedSongs.splice(uploadedIndex, 1)
  }
  
  if (songsIndex !== -1) {
    songs.splice(songsIndex, 1)
  }
  
  clearCache('songs')
  clearCache('uploaded')
  
  res.json({ success: true, message: '删除成功' })
}))

app.use('/uploads', express.static('uploads'))

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
