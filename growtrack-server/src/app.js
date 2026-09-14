require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { prisma } = require('./db');
const authRoutes = require('./routes/auth');
const timeEntryRoutes = require('./routes/timeEntries');
const goalRoutes = require('./routes/goals');
const habitRoutes = require('./routes/habits');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3001;

const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:8090,http://localhost:3000').split(',');
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// 请求日志
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/categories', categoryRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, _req, res, _next) => {
  console.error('未处理错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
async function start() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (err) {
    console.warn('⚠️  数据库未连接 - API 在无数据库模式下运行');
    console.warn('   请安装 PostgreSQL 或配置正确的 DATABASE_URL');
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 GrowTrack 服务已启动: http://localhost:${PORT}`);
    console.log(`   健康检查: http://localhost:${PORT}/health\n`);
  });
}

start();
