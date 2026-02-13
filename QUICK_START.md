# 快速部署指南 - 音乐平台

## 📋 服务器信息
- **服务器ID**: i-bp11gajqvnzsdr6wpdji
- **IP地址**: 121.43.125.150
- **用户名**: root

## 🚀 一键部署（推荐）

### 1. 赋予脚本执行权限
```bash
chmod +x deploy.sh
```

### 2. 执行部署脚本
```bash
./deploy.sh
```

脚本会自动完成以下操作：
- ✅ 构建前端
- ✅ 创建部署包
- ✅ 上传到服务器
- ✅ 安装后端依赖
- ✅ 启动后端服务（使用PM2）
- ✅ 配置开机自启

## 📝 手动部署步骤

### 步骤 1：SSH 登录服务器
```bash
ssh root@121.43.125.150
```

### 步骤 2：安装 Node.js 和 PM2
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 加载 nvm
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18

# 安装 PM2
npm install -g pm2
```

### 步骤 3：安装 Nginx
```bash
sudo apt update
sudo apt install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 步骤 4：上传项目文件

**方式 A：使用 scp**
```bash
scp -r /path/to/music-platform root@121.43.125.150:/var/www/
```

**方式 B：使用 rsync（推荐）**
```bash
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='uploads' \
  --exclude='frontend/dist' \
  --exclude='frontend/node_modules' \
  /path/to/music-platform/ \
  root@121.43.125.150:/var/www/music-platform/
```

### 步骤 5：在服务器上安装依赖和构建

```bash
# SSH 登录服务器
ssh root@121.43.125.150

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

### 步骤 6：配置 Nginx

```bash
# 复制配置文件
sudo cp /var/www/music-platform/nginx.conf /etc/nginx/sites-available/music-platform

# 测试配置
sudo nginx -t

# 启用配置
sudo ln -s /etc/nginx/sites-available/music-platform /etc/nginx/sites-enabled/

# 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 7：启动后端服务

```bash
cd /var/www/music-platform/backend

# 使用 PM2 启动
pm2 start server.js --name music-platform-backend

# 设置开机自启
pm2 startup
pm2 save

# 查看服务状态
pm2 status

# 查看日志
pm2 logs music-platform-backend
```

### 步骤 8：配置防火墙

```bash
# 配置 UFW 防火墙
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 🌐 访问地址

部署完成后，可以通过以下地址访问：

- **前端**: http://121.43.125.150
- **后端 API**: http://121.43.125.150/api/v1
- **音频文件**: http://121.43.125.150/uploads/

## 📊 常用命令

### PM2 命令
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

### Nginx 命令
```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 重新加载配置
sudo systemctl reload nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/music-platform-access.log
```

## 🔧 故障排查

### 问题 1：无法访问网站
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查防火墙
sudo ufw status

# 检查端口监听
sudo netstat -tulpn | grep :80
```

### 问题 2：后端服务无法启动
```bash
# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs music-platform-backend --err

# 手动测试
cd /var/www/music-platform/backend
node server.js
```

### 问题 3：上传文件无法访问
```bash
# 检查 uploads 目录权限
ls -la /var/www/music-platform/backend/uploads

# 修复权限
sudo chmod 755 /var/www/music-platform/backend/uploads
sudo chown -R www-data:www-data /var/www/music-platform/backend/uploads
```

## ⚠️ 重要提示

1. **数据持久化**: 当前使用内存存储，服务器重启后数据会丢失。生产环境建议使用 MongoDB 或 PostgreSQL。

2. **文件备份**: 定期备份 `uploads` 目录中的音频文件。

3. **HTTPS**: 建议使用 Let's Encrypt 配置 HTTPS，提高安全性。

4. **域名解析**: 如果使用域名，确保域名正确解析到服务器 IP。

5. **监控告警**: 建议配置监控告警，及时发现问题。

## 📞 技术支持

如遇到问题，请检查：
1. PM2 日志: `pm2 logs music-platform-backend`
2. Nginx 日志: `sudo tail -f /var/log/nginx/error.log`
3. 浏览器控制台错误
4. 网络连接状态