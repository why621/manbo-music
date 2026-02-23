<<<<<<< HEAD
# 曼波音乐 (Manbo Music)

一个免费的开源音乐平台，支持音乐上传、播放、歌单管理等功能。

## 功能特性

- 🎵 **音乐播放** - 在线播放音乐，支持多种格式
- 📤 **音乐上传** - 上传本地音乐文件，自动提取元数据
- 📋 **歌单管理** - 创建和管理个人歌单
- 📜 **播放历史** - 记录播放历史
- 👤 **用户系统** - 注册、登录、个人资料管理
- 🌙 **主题切换** - 支持明暗主题切换
- 📱 **响应式设计** - 支持桌面端和移动端

## 技术栈

### 前端
- Vue 3 + Vite
- Vue Router
- Axios
- CSS3 + 响应式设计

### 后端
- Node.js + Express
- Multer (文件上传)
- music-metadata (音频元数据解析)

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 开发模式

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端开发服务器
cd ../frontend
npm run dev
```

### 生产部署

```bash
# 构建前端
cd frontend
npm run build

# 启动后端服务
cd ../backend
npm start
```

## 项目结构

```
music-platform/
├── backend/              # 后端服务
│   ├── server.js         # 主服务器文件
│   ├── package.json      # 后端依赖
│   └── uploads/          # 上传的音频文件
├── frontend/             # 前端应用
│   ├── src/              # 源代码
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 通用组件
│   │   ├── api/          # API 接口
│   │   └── router/       # 路由配置
│   ├── package.json      # 前端依赖
│   └── dist/             # 构建输出
├── .gitignore            # Git 忽略文件
├── nginx.conf            # Nginx 配置
├── ecosystem.config.json # PM2 配置
└── README.md             # 项目说明
```

## API 接口

### 用户相关
- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录
- `GET /api/v1/users/profile` - 获取用户信息
- `PUT /api/v1/users/profile` - 更新用户信息

### 音乐相关
- `GET /api/v1/songs` - 获取歌曲列表
- `GET /api/v1/songs/:id` - 获取歌曲详情
- `GET /api/v1/songs/search` - 搜索歌曲

### 上传相关
- `POST /api/v1/upload/song` - 上传歌曲
- `GET /api/v1/upload/songs` - 获取上传的歌曲
- `DELETE /api/v1/upload/song/:id` - 删除歌曲

### 歌单相关
- `GET /api/v1/playlists` - 获取歌单列表
- `POST /api/v1/playlists` - 创建歌单
- `POST /api/v1/playlists/:playlistId/songs/:songId` - 添加歌曲到歌单
- `DELETE /api/v1/playlists/:id` - 删除歌单

## 部署说明

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 或 [QUICK_START.md](./QUICK_START.md)



## 贡献

欢迎提交 Issue 和 Pull Request！
=======
# manbo-music
a free music platform
>>>>>>> d221ebc3f4150d4a5c3bf30c4b430c3abcdf3b13
