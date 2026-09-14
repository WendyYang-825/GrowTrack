const { verifyToken } = require('../auth');
const { prisma } = require('../db');

// 认证中间件：验证 Access Token，注入 req.userId
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证Token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== 'access') {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }

  // 确认用户存在
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, nickname: true },
  });

  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }

  // 注入用户信息，后续所有数据库查询都会带上 userId 实现隔离
  req.user = user;
  req.userId = user.id;
  next();
}

// 可选认证：有 Token 就注入用户，没有也继续
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded && decoded.type === 'access') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, nickname: true },
      });
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
  }
  next();
}

// 数据隔离查询助手：所有业务查询必须带上 userId
function scopedQuery(req) {
  return { userId: req.userId };
}

module.exports = { authMiddleware, optionalAuth, scopedQuery };
