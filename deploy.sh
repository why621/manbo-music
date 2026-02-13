#!/bin/bash

# 音乐平台部署脚本

set -e

echo "======================================"
echo "  音乐平台部署脚本"
echo "======================================"

# 配置
PROJECT_NAME="music-platform"
SERVER_USER="root"
SERVER_IP="121.43.125.150"
DEPLOY_PATH="/var/www/$PROJECT_NAME"
DOMAIN="121.43.125.150"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印成功消息
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 函数：打印错误消息
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# 函数：打印警告消息
warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查本地环境
echo "检查本地环境..."

if ! command -v node &> /dev/null; then
    error "Node.js 未安装"
fi

if ! command -v npm &> /dev/null; then
    error "npm 未安装"
fi

success "本地环境检查通过"

# 构建前端
echo ""
echo "构建前端..."
cd frontend
npm install
npm run build
success "前端构建完成"

# 创建部署包
echo ""
echo "创建部署包..."
cd ..
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='uploads' \
    --exclude='frontend/dist' \
    --exclude='frontend/node_modules' \
    --exclude='.DS_Store' \
    --exclude='*.log' \
    .

success "部署包创建完成"

# 上传到服务器
echo ""
echo "上传文件到服务器..."
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
success "文件上传完成"

# 在服务器上执行部署
echo ""
echo "在服务器上执行部署..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# 创建目录
sudo mkdir -p $DEPLOY_PATH
sudo chown -R $USER:$USER $DEPLOY_PATH

# 解压文件
cd /tmp
tar -xzf deploy.tar.gz -C $DEPLOY_PATH

# 安装后端依赖
cd $DEPLOY_PATH/backend
npm install --production

# 创建 uploads 目录
mkdir -p uploads
chmod 755 uploads

# 安装 PM2（如果未安装）
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 停止旧服务
pm2 stop music-platform-backend 2>/dev/null || true

# 启动新服务
pm2 start server.js --name music-platform-backend

# 设置开机自启
pm2 startup
pm2 save

echo "部署完成！"
ENDSSH

success "服务器部署完成"

# 清理本地临时文件
echo ""
echo "清理临时文件..."
rm -f deploy.tar.gz
success "临时文件清理完成"

# 显示部署信息
echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "后端服务状态："
ssh $SERVER_USER@$SERVER_IP "pm2 status music-platform-backend"
echo ""
echo "访问地址："
echo "  http://$DOMAIN"
echo ""
echo "常用命令："
echo "  查看日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs music-platform-backend'"
echo "  重启服务: ssh $SERVER_USER@$SERVER_IP 'pm2 restart music-platform-backend'"
echo "  停止服务: ssh $SERVER_USER@$SERVER_IP 'pm2 stop music-platform-backend'"
echo ""