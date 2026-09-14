# GrowTrack

自我观察与成长量化 SaaS — 为申请 N1 AI School 打造的个人成长追踪系统。

## 项目结构

```
growtrack/
├── growtrack-app/         # 前端（纯静态 HTML/CSS/JS）
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js         # API 客户端（自动 Token 刷新）
│   │   ├── store.js       # Mock 数据
│   │   ├── router.js      # Hash 路由
│   │   └── app.js         # 8 个页面渲染器
│   └── vercel.json
├── growtrack-server/      # 后端（Node.js + Express + Prisma）
│   ├── src/
│   │   ├── app.js         # Express 主入口
│   │   ├── auth.js        # JWT + bcrypt 认证
│   │   ├── db.js          # Prisma 客户端
│   │   ├── middleware/auth.js  # 认证中间件 + 数据隔离
│   │   └── routes/        # 5 个路由模块
│   ├── prisma/
│   │   ├── schema.prisma  # 数据库 Schema（9 张表）
│   │   ├── rls.sql        # PostgreSQL RLS 策略
│   │   └── seed.js        # 种子数据
│   ├── railway.json       # Railway 部署配置
│   └── .env.example
├── .gitignore
└── README.md
```

## 部署指南

详细部署步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 方案一：Railway + Vercel（推荐）

**后端 → Railway**
1. GitHub 推送代码
2. Railway "Deploy from GitHub repo"
3. Root Directory: `growtrack-server`
4. 添加 PostgreSQL 数据库服务
5. 设置环境变量（见 .env.example）
6. 生成域名

**前端 → Vercel**
1. Vercel "Add New Project"
2. Root Directory: `growtrack-app`
3. 部署后获得域名
4. 更新后端 CORS_ORIGINS 为 Vercel 域名

### 本地开发

```bash
# 后端
cd growtrack-server
cp .env.example .env  # 编辑数据库连接
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev

# 前端
cd growtrack-app
npx http-server -p 8090
```

## 技术栈

- 前端：HTML/CSS/Vanilla JS + ECharts
- 后端：Node.js + Express + Prisma ORM
- 数据库：PostgreSQL（开发可用 SQLite）
- 认证：JWT 双 Token + bcrypt 密码哈希
- 安全：数据隔离 + RLS + Zod 输入验证

## 测试账号

```
邮箱：test@growtrack.com
密码：password123
```
