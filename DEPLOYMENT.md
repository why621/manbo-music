# 音乐平台部署指南

## 项目结构

```
music-platform/
├── backend/           # 后端服务 (Node.js + Express)
│   ├── server.js
│   ├── package.json
│   └── uploads/       # 上传的音频文件
├── frontend/          # 前端应用 (Vue 3 + Vite)
│   ├── src/
│   ├── package.json
│   └── dist/          # 构建后的静态文件
└── README.md
```

## 服务器要求

- Node.js >= 18.x
- npm >= 9.x
- Nginx (推荐用于反向代理和静态文件服务)

## 部署步骤

### 1. 准备服务器环境

```bash
# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 Nginx
sudo apt update
sudo apt install nginx -y

# 安装 PM2 (进程管理器)
npm install -g pm2
```

### 2. 上传项目文件

将整个项目上传到服务器，例如上传到 `/var/www/music-platform`

```bash
# 使用 scp 上传
scp -r /path/to/music-platform user@your-server:/var/www/

# 或使用 rsync
rsync -avz /path/to/music-platform/ user@your-server:/var/www/music-platform/
```

### 3. 安装依赖

```bash
cd /var/www/music-platform/backend
npm install --production

cd /var/www/music-platform/frontend
npm install
npm run build
```

### 4. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/music-platform`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/music-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传的音频文件
    location /uploads/ {
        alias /var/www/music-platform/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/music-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 使用 PM2 启动后端服务

```bash
cd /var/www/music-platform/backend

# 启动服务
pm2 start server.js --name "music-platform-backend"

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs music-platform-backend

# 重启服务
pm2 restart music-platform-backend
```

### 6. 配置防火墙

```bash
# 开放 HTTP 和 HTTPS 端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 7. 配置 HTTPS (可选但推荐)

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 环境变量

创建 `.env` 文件（如果需要）：

```bash
cd /var/www/music-platform/backend
cat > .env << EOF
NODE_ENV=production
PORT=8080
EOF
```

## 监控和维护

```bash
# 查看 PM2 状态
pm2 status

# 查看资源使用
pm2 monit

# 查看日志
pm2 logs --lines 100

# 重启服务
pm2 restart all

# 停止服务
pm2 stop music-platform-backend
```

## 故障排查

### 后端无法启动

```bash
# 检查端口占用
sudo netstat -tulpn | grep :8080

# 查看详细日志
pm2 logs music-platform-backend --err

# 检查 Node.js 版本
node --version
```

### 前端无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查文件权限
sudo chown -R www-data:www-data /var/www/music-platform/frontend/dist
```

### 上传文件无法访问

```bash
# 检查 uploads 目录权限
sudo chown -R www-data:www-data /var/www/music-platform/backend/uploads
sudo chmod -R 755 /var/www/music-platform/backend/uploads
```

## 更新部署

```bash
# 1. 上传新代码
scp -r /path/to/music-platform user@your-server:/var/www/music-platform/

# 2. 重新安装依赖
cd /var/www/music-platform/backend
npm install --production

cd /var/www/music-platform/frontend
npm install
npm run build

# 3. 重启后端服务
pm2 restart music-platform-backend

# 4. 重新加载 Nginx
sudo systemctl reload nginx
```

## 性能优化建议

1. 启用 Nginx 缓存
2. 使用 CDN 加速静态资源
3. 配置数据库（当前使用内存存储，生产环境建议使用 MongoDB 或 PostgreSQL）
4. 启用 Gzip 压缩
5. 配置反向代理缓存

## 安全建议

1. 使用 HTTPS
2. 配置防火墙
3. 限制上传文件大小
4. 定期更新依赖
5. 配置 CORS 白名单
6. 使用环境变量存储敏感信息