# GrowTrack 部署指南

## 架构概览

```
用户浏览器 → Vercel (前端静态文件)
                ↓ API 请求
           Railway (Node.js 后端 + PostgreSQL)
```

---

## 第一步：部署后端到 Railway

### 1. 切换数据库为 PostgreSQL

修改 `growtrack-server/prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

修改 `growtrack-server/.env`（本地开发用，Railway 上用环境变量）：

```
DATABASE_URL="postgresql://用户名:密码@localhost:5432/growtrack"
```

### 2. 创建 Railway 项目

1. 注册 https://railway.app （用 GitHub 账号登录）
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库，Root Directory 设为 `growtrack-server`
4. Railway 会自动检测 Node.js 项目

### 3. 添加 PostgreSQL 数据库

1. 在 Railway 项目中点 "New" → "Database" → "PostgreSQL"
2. Railway 自动创建数据库并生成连接 URL
3. 在后端服务的 Variables 中添加：
   - `DATABASE_URL` = Railway 提供的 PostgreSQL 连接 URL
   - `JWT_SECRET` = 随机字符串（可用 `openssl rand -hex 32` 生成）
   - `JWT_ACCESS_EXPIRES` = `15m`
   - `JWT_REFRESH_EXPIRES` = `7d`
   - `PORT` = `3001`

### 4. 配置构建和启动命令

在 Railway 后端服务的 Settings 中：

- **Build Command**: `npm install && npx prisma generate && npx prisma db push`
- **Start Command**: `node src/app.js`

### 5. 生成域名

- Settings → Networking → "Generate Domain"
- 获得类似 `https://growtrack-server.up.railway.app` 的地址

### 6. 初始化种子数据

部署成功后，在 Railway 后端服务的 Terminal 中运行：

```bash
node prisma/seed.js
```

---

## 第二步：部署前端到 Vercel

### 1. 配置 API 地址

在 `growtrack-app/js/store.js` 顶部添加：

```javascript
const API_BASE = 'https://growtrack-server.up.railway.app/api';
```

### 2. 部署到 Vercel

1. 注册 https://vercel.com （用 GitHub 登录）
2. "Add New Project" → 选择仓库
3. 配置：
   - Framework Preset: `Other`
   - Root Directory: `growtrack-app`
   - Build Command: 留空（纯静态无需构建）
   - Output Directory: `growtrack-app`
4. 点 "Deploy"
5. 获得 `https://growtrack.vercel.app` 地址

### 3. 更新后端 CORS

在 `growtrack-server/src/app.js` 中修改 CORS 配置：

```javascript
app.use(cors({
  origin: ['https://growtrack.vercel.app', 'http://localhost:8090'],
  credentials: true,
}));
```

---

## 方案二：VPS 自主部署（适合有服务器的情况）

### 1. 准备服务器

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 PM2（进程守护）
sudo npm install -g pm2

# 安装 Nginx（反向代理）
sudo apt install -y nginx
```

### 2. 创建数据库

```bash
sudo -u postgres psql
```

```sql
CREATE USER growtrack WITH PASSWORD 'your_secure_password';
CREATE DATABASE growtrack OWNER growtrack;
GRANT ALL PRIVILEGES ON DATABASE growtrack TO growtrack;
\q
```

### 3. 部署代码

```bash
git clone <your-repo> /var/www/growtrack
cd /var/www/growtrack/growtrack-server
npm install
cp .env.example .env  # 编辑 .env 填入生产配置
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### 4. 用 PM2 启动后端

```bash
cd /var/www/growtrack/growtrack-server
pm2 start src/app.js --name growtrack-api
pm2 startup
pm2 save
```

### 5. 配置 Nginx

```nginx
# /etc/nginx/sites-available/growtrack
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/growtrack/growtrack-app;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/growtrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. 配置 HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 方案三：Docker 一键部署

### 创建 Dockerfile

`growtrack-server/Dockerfile`:

```dockerfile
FROM node:20-slim

WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm ci --production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node src/app.js"]
```

### 创建 docker-compose.yml

项目根目录 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: growtrack
      POSTGRES_PASSWORD: growtrack123
      POSTGRES_DB: growtrack
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: ./growtrack-server
    environment:
      DATABASE_URL: postgresql://growtrack:growtrack123@db:5432/growtrack
      JWT_SECRET: growtrack_jwt_secret_key_2026
      JWT_ACCESS_EXPIRES: 15m
      JWT_REFRESH_EXPIRES: 7d
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - db

  web:
    image: nginx:alpine
    volumes:
      - ./growtrack-app:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  pgdata:
```

启动：

```bash
docker-compose up -d
```

---

## 部署后检查清单

- [ ] 后端健康检查：`https://your-api-domain/health` 返回 ok
- [ ] 注册接口：POST `/api/auth/register` 返回 Token
- [ ] 登录接口：POST `/api/auth/login` 返回双 Token
- [ ] 前端页面正常加载
- [ ] CORS 配置正确（前端域名能访问后端）
- [ ] HTTPS 已启用
- [ ] 数据库备份策略已配置

## 费用估算

| 方案 | 月费用 | 适用场景 |
|------|--------|----------|
| Railway + Vercel | 免费 → ~$5 | MVP / 小规模 |
| VPS (2GB RAM) | ~$5 | 中等规模 |
| Docker + 云服务器 | ~$5-10 | 需要完全控制 |
