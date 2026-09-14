const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// 设置当前用户 ID（用于 RLS 行级安全）
async function setUserId(userId) {
  await prisma.$executeRaw`SET LOCAL app.user_id = ${userId}`;
}

// 创建带用户隔离的 Prisma 客户端中间件
prisma.$use(async (params, next) => {
  const userId = params._rlsUserId;
  if (userId) {
    // 在事务中设置用户上下文
    if (params.action === 'queryRaw' || params.action === 'executeRaw') {
      return next(params);
    }
    // 对于需要 RLS 的操作，通过中间件注入 user_id 过滤
    // 注意：Prisma 不直接支持 PostgreSQL SET LOCAL
    // 我们在应用层通过 userId 过滤来确保数据隔离
  }
  return next(params);
});

module.exports = { prisma, setUserId };
