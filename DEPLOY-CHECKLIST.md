# 部署操作手册（跟着点就能完成 ⏱️ 约10分钟）

> 由于部署需要你的 GitHub、Railway、Vercel 账号，需要你手动点击操作。以下是详细步骤。

---

## 📋 部署前准备

确保你有以下账号（都是免费注册）：
- [GitHub](https://github.com) 账号
- [Railway](https://railway.app) 账号（可用 GitHub 登录）
- [Vercel](https://vercel.com) 账号（可用 GitHub 登录）

---

## Step 1：创建 GitHub 仓库（2分钟）

1. 打开：https://github.com/new
2. **Repository name** 填 `growtrack`
3. **Description** 可选填：`Self-observation & growth tracking SaaS`
4. 选 **Public**
5. ❌ **不要**勾选 Add a README file
6. ❌ **不要**勾选 Add .gitignore
7. ❌ **不要**勾选 Choose a license
8. 点击 **Create repository**
9. 复制页面上显示的 HTTPS 地址，形如：`https://github.com/你的用户名/growtrack.git`

### 推送代码

在项目根目录打开终端（PowerShell），执行：

```powershell
cd "C:\Users\asus\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6aa69f9d7b32d1835639c147"
git remote add origin https://github.com/你的用户名/growtrack.git
git branch -M main
git push -u origin main
```

> 第一次 push 会弹出 GitHub 登录窗口，按提示登录授权即可。

---

## Step 2：部署后端到 Railway（3分钟）

1. 打开：https://railway.app ，点 **Login** → 用 GitHub 登录
2. 点 **New Project** → 点 **Deploy from GitHub repo**
3. 找到 `growtrack` 仓库，点 **Select**
4. 配置：
   - **Root Directory** 填：`growtrack-server`
   - 其他保持默认
5. 点 **Deploy**（开始部署，先让它跑着，我们继续下一步）

### 添加 PostgreSQL 数据库

1. 在 Railway 项目页面，点右上角 **New** → **Database**
2. 选择 **PostgreSQL**
3. 等待数据库创建完成（约30秒）
4. 点数据库 → **Variables** → 复制 `DATABASE_URL` 的值（备用）

### 配置环境变量

1. 点后端服务（叫 growtrack-server 或类似名字）
2. 切到 **Variables** 标签页
3. 点 **New Variable** 或 **Edit Variables**，添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | （从 PostgreSQL 服务的 Variables 复制过来） |
| `JWT_SECRET` | 打开 https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new 生成随机字符串 |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `CORS_ORIGINS` | `http://localhost:8090,http://localhost:3000` |
| `PORT` | `3001` |

4. 保存后服务会自动重新部署

### 验证后端

1. 点后端服务 → **Settings** → **Networking** → **Generate Domain**
2. 获得一个域名，形如 `growtrack-production-xxx.up.railway.app`
3. 浏览器打开：`https://你的域名/health`
4. 看到 `{"status":"ok"}` 说明后端部署成功 🎉

### 初始化种子数据

1. 点后端服务 → **More** → **Run Command**
2. 输入命令：`node prisma/seed.js`
3. 点 **Run Command**
4. 看到 "初始化完成" 说明成功

---

## Step 3：部署前端到 Vercel（2分钟）

1. 打开：https://vercel.com ，点 **Sign Up** → 用 GitHub 登录
2. 点 **Add New...** → **Project**
3. 找到 `growtrack` 仓库，点 **Import**
4. 配置：
   - **Project Name**: `growtrack`（可改）
   - **Framework Preset**: `Other`
   - **Root Directory**: 点 **Edit** → 选 `growtrack-app` → **Continue**
   - **Build Command**: 留空
   - **Output Directory**: 留空（默认 public 或根目录）
5. 点 **Deploy**
6. 等待部署完成（约1分钟）
7. 获得一个域名，形如 `growtrack-xxx.vercel.app`

---

## Step 4：连接前后端（2分钟）

### 4.1 修改后端 CORS

1. 回到 Railway 后端服务 → **Variables**
2. 找到 `CORS_ORIGINS`，更新为：
   ```
   https://你的vercel域名.vercel.app,http://localhost:8090
   ```
3. 保存，等待服务重启

### 4.2 修改前端 API 地址

在本地修改 `growtrack-app/js/api.js` 第 4 行：

```javascript
// 从 http://localhost:3001/api 改成你的 Railway 域名
baseURL: 'https://你的railway域名.up.railway.app/api',
```

然后提交推送：

```powershell
git add .
git commit -m "Update API base URL to production"
git push
```

Vercel 会自动重新部署前端。

---

## Step 5：验证上线 ✅

1. 打开你的 Vercel 域名
2. 注册一个账号（测试用）
3. 登录后测试各功能
4. 也可以用种子账号登录：`test@growtrack.com / password123`

---

## 常见问题

**Q: Railway 部署失败？**
A: 看后端服务的 **Deployments** → 点最新的 → 看 **Build Logs** 错误信息。常见原因是环境变量没配置。

**Q: 前端访问后端报 CORS 错误？**
A: 检查 Railway 的 `CORS_ORIGINS` 变量是否包含前端域名（不要末尾的 `/`）。

**Q: 数据库连接失败？**
A: 确认 `DATABASE_URL` 是从 PostgreSQL 服务复制的完整 URL。

---

## 部署完成后的文件结构

```
GitHub 仓库 growtrack/
├── growtrack-app/      → Vercel 自动部署
├── growtrack-server/   → Railway 自动部署
└── prisma/schema.prisma
```

**整个过程约 10 分钟，你只需要点击操作，代码会自动构建和部署。**
