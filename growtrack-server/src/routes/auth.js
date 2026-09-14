const { Router } = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
} = require('../auth');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

// 注册
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  nickname: z.string().min(1, '昵称不能为空').max(30),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // 检查邮箱是否已注册
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: '该邮箱已注册' });
    }

    // 创建用户
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        nickname: data.nickname,
      },
      select: { id: true, email: true, nickname: true },
    });

    // 创建默认分类
    const defaultCategories = [
      { name: '编程开发', dimension: 'coding', color: '#228BE6', icon: '💻' },
      { name: '课程学习', dimension: 'learning', color: '#12B886', icon: '📚' },
      { name: '阅读输入', dimension: 'reading', color: '#7950F2', icon: '📖' },
      { name: '输出创作', dimension: 'writing', color: '#E64980', icon: '✍️' },
      { name: '运动健康', dimension: 'exercise', color: '#FF7A45', icon: '🏃' },
      { name: '专注冥想', dimension: 'focus', color: '#FAAD14', icon: '🧘' },
    ];
    await prisma.category.createMany({
      data: defaultCategories.map((c, i) => ({
        ...c,
        userId: user.id,
        isDefault: true,
        sortOrder: i,
      })),
    });

    // 创建用户设置
    await prisma.userSettings.create({
      data: { userId: user.id },
    });

    // 生成 Token
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    const refreshTokenHash = await hashToken(refreshToken);

    // 存储 Refresh Token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        deviceInfo: req.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 登录
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    const refreshTokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        deviceInfo: req.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        timezone: user.timezone,
        isPremium: user.isPremium,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: '请输入邮箱和密码' });
    }
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// 刷新 Token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: '缺少 refreshToken' });
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded || decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Refresh Token 无效' });
  }

  // 查找存储的 refresh token
  const storedTokens = await prisma.refreshToken.findMany({
    where: {
      userId: decoded.userId,
      expiresAt: { gt: new Date() },
    },
  });

  let validToken = null;
  for (const t of storedTokens) {
    if (await verifyPassword(refreshToken, t.tokenHash)) {
      validToken = t;
      break;
    }
  }

  if (!validToken) {
    return res.status(401).json({ error: 'Refresh Token 不匹配' });
  }

  // 删除旧 token，生成新 token（旋转机制）
  await prisma.refreshToken.delete({ where: { id: validToken.id } });

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, nickname: true },
  });

  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  const newAccessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id, user.email);
  const newTokenHash = await hashToken(newRefreshToken);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newTokenHash,
      deviceInfo: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      timezone: true,
      locale: true,
      isPremium: true,
      onboardedAt: true,
      createdAt: true,
    },
  });
  res.json({ user });
});

// 登出（删除 refresh token）
router.post('/logout', authMiddleware, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const decoded = verifyToken(refreshToken);
    if (decoded && decoded.type === 'refresh') {
      // 删除该用户的所有 refresh tokens（强制所有设备登出）
      await prisma.refreshToken.deleteMany({
        where: { userId: req.userId },
      });
    }
  }
  res.json({ message: '已登出' });
});

module.exports = router;
