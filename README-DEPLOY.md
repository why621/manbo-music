# 音乐平台 - 阿里云服务器部署指南

## 📋 前置要求

### 服务器要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Nginx**: >= 1.18
- **内存**: 至少 1GB RAM
- **磁盘**: 至少 10GB 可用空间

### 本地要求
- Git
- SSH 客户端
- Node.js >= 18.0.0

## 🚀 快速部署

### 方式一：使用自动化脚本（推荐）

1. **修改部署脚本**

编辑 `deploy.sh`，修改以下配置：
```bash
SERVER_USER="root"           # 服务器用户名
SERVER_IP="your-server-ip"   # 服务器 IP 地址
DOMAIN="your-domain.com"     # 你的域名
```

2. **赋予执行权限**
```bash
chmod +x deploy.sh
```

3. **执行部署**
```bash
./deploy.sh
```

脚本会自动完成：
- ✅ 构建前端
- ✅ 创建部署包
- ✅ 上传到服务器
- ✅ 安装依赖
- ✅ 启动后端服务
- ✅ 配置 PM2

### 方式二：手动部署

#### 步骤 1：准备服务器环境

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 Nginx
sudo apt install nginx -y

# 安装 PM2
npm install -g pm2

# 创建项目目录
sudo mkdir -p /var/www/music-platform
sudo chown -R $USER:$USER /var/www/music-platform
```

#### 步骤 2：上传项目文件

```bash
# 在本地执行
scp -r /path/to/music-platform root@your-server-ip:/var/www/

# 或使用 rsync（推荐）
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='uploads' \
  --exclude='frontend/dist' \
  --exclude='frontend/node_modules' \
  /path/to/music-platform/ \
  root@your-server-ip:/var/www/music-platform/
```

#### 步骤 3：安装依赖并构建

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 安装后端依赖
cd /var/www/music-platform/backend
npm install --production

# 安装前端依赖并构建
cd /var/www/music-platform/frontend
npm install
npm run build

# 创建 uploads 目录
cd /var/www/music-platform/backend
mkdir -p uploads
chmod 755 uploads
```

#### 步骤 4：配置 Nginx

```bash
# 复制配置文件
sudo cp /var/www/music-platform/nginx.conf /etc/nginx/sites-available/music-platform

# 修改配置中的域名和路径
sudo nano /etc/nginx/sites-available/music-platform

# 测试配置
sudo nginx -t

# 启用配置
sudo ln -s /etc/nginx/sites-available/music-platform /etc/nginx/sites-enabled/

# 重启 Nginx
sudo systemctl restart nginx
```

#### 步骤 5：启动后端服务

```bash
# 使用 PM2 启动
cd /var/www/music-platform/backend
pm2 start server.js --name music-platform-backend

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status

# 查看日志
pm2 logs music-platform-backend
```

## 🔧 配置说明

### Nginx 配置要点

1. **反向代理**: 将 `/api/*` 请求转发到后端 8080 端口
2. **静态文件**: 直接服务前端构建后的文件
3. **文件上传**: `/uploads/*` 路径提供音频文件访问
4. **Gzip 压缩**: 启用 Gzip 提升加载速度
5. **缓存策略**: 静态资源设置 7 天缓存

### PM2 配置要点

1. **自动重启**: 服务崩溃时自动重启
2. **日志管理**: 自动分割和轮转日志
3. **内存限制**: 超过 500MB 自动重启
4. **开机自启**: 服务器重启后自动启动

## 🔐 安全配置

### 防火墙配置

```bash
# 配置 UFW 防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### HTTPS 配置（推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run

# 添加自动续期任务
sudo crontab -e
# 添加以下行（每月 1 号凌晨 3 点）
0 3 1 * * certbot renew --quiet
```

## 📊 监控和维护

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs music-platform-backend

# 查看实时日志
pm2 logs music-platform-backend --lines 100

# 重启服务
pm2 restart music-platform-backend

# 停止服务
pm2 stop music-platform-backend

# 查看资源使用
pm2 monit
```

### Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/music-platform-access.log

# 错误日志
sudo tail -f /var/log/nginx/music-platform-error.log
```

## 🔄 更新部署

### 更新代码

```bash
# 1. 本地更新代码
git pull

# 2. 重新构建
cd frontend
npm install
npm run build

# 3. 上传到服务器
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='uploads' \
  --exclude='frontend/dist' \
  --exclude='frontend/node_modules' \
  /path/to/music-platform/ \
  root@your-server-ip:/var/www/music-platform/

# 4. 在服务器上重新安装依赖
ssh root@your-server-ip 'cd /var/www/music-platform/backend && npm install --production'

# 5. 重启服务
ssh root@your-server-ip 'pm2 restart music-platform-backend'

# 6. 重新加载 Nginx
ssh root@your-server-ip 'sudo systemctl reload nginx'
```

## 🐛 故障排查

### 问题：后端服务无法启动

```bash
# 检查端口占用
sudo netstat -tulpn | grep :8080

# 查看详细错误日志
pm2 logs music-platform-backend --err

# 检查 Node.js 版本
node --version

# 手动启动测试
cd /var/www/music-platform/backend
node server.js
```

### 问题：前端无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查文件权限
sudo chown -R www-data:www-data /var/www/music-platform/frontend/dist
sudo chmod -R 755 /var/www/music-platform/frontend/dist

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 问题：上传文件无法访问

```bash
# 检查 uploads 目录权限
sudo chown -R www-data:www-data /var/www/music-platform/backend/uploads
sudo chmod -R 755 /var/www/music-platform/backend/uploads

# 检查 Nginx 配置中的 alias 路径
```

### 问题：API 请求失败

```bash
# 检查后端服务状态
pm2 status

# 检查 Nginx 代理配置
sudo nginx -t

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/music-platform-access.log | grep api
```

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `.gitignore` | Git 忽略文件配置 |
| `deploy.sh` | 自动化部署脚本 |
| `nginx.conf` | Nginx 配置文件模板 |
| `ecosystem.config.json` | PM2 进程管理配置 |
| `DEPLOYMENT.md` | 详细部署文档 |

## 🎯 性能优化建议

1. **启用 Nginx 缓存**: 对 API 响应进行缓存
2. **使用 CDN**: 静态资源使用 CDN 加速
3. **数据库优化**: 当前使用内存存储，生产环境建议使用 MongoDB 或 PostgreSQL
4. **启用 HTTP/2**: 提升并发性能
5. **配置 Gzip**: 已启用，可调整压缩级别

## 📞 技术支持

如遇到问题，请检查：
1. 服务器日志：`pm2 logs music-platform-backend`
2. Nginx 日志：`/var/log/nginx/`
3. 浏览器控制台错误
4. 网络连接状态

## 📝 注意事项

1. **数据持久化**: 当前使用内存存储，服务器重启后数据会丢失。生产环境建议使用数据库。
2. **文件备份**: 定期备份 `uploads` 目录中的音频文件。
3. **安全更新**: 定期更新 Node.js 和依赖包。
4. **监控告警**: 建议配置监控告警，及时发现问题。
5. **域名解析**: 确保域名正确解析到服务器 IP。