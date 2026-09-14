const { Router } = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取时间记录列表（支持日期范围筛选）
router.get('/', async (req, res) => {
  const { startDate, endDate, categoryId, goalId, limit, offset } = req.query;

  const where = { userId: req.userId };

  if (startDate || endDate) {
    where.dateKey = {};
    if (startDate) where.dateKey.gte = new Date(startDate);
    if (endDate) where.dateKey.lte = new Date(endDate);
  }
  if (categoryId) where.categoryId = categoryId;
  if (goalId) where.goalId = goalId;

  const entries = await prisma.timeEntry.findMany({
    where,
    include: { category: true },
    orderBy: { startTime: 'desc' },
    take: limit ? parseInt(limit) : 100,
    skip: offset ? parseInt(offset) : 0,
  });

  res.json({ data: entries });
});

// 获取汇总数据（日/周/月）
router.get('/summary', async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0,0,0,0));
  const end = endDate ? new Date(endDate) : new Date();

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: req.userId,
      dateKey: { gte: start, lte: end },
    },
    include: { category: true },
    orderBy: { startTime: 'asc' },
  });

  // 按分类汇总
  const byCategory = {};
  let totalDuration = 0;
  for (const e of entries) {
    const cat = e.category;
    if (!byCategory[cat.id]) {
      byCategory[cat.id] = {
        categoryId: cat.id,
        categoryName: cat.name,
        dimension: cat.dimension,
        color: cat.color,
        icon: cat.icon,
        totalDuration: 0,
        count: 0,
      };
    }
    byCategory[cat.id].totalDuration += e.duration;
    byCategory[cat.id].count += 1;
    totalDuration += e.duration;
  }

  // 按维度汇总
  const byDimension = {};
  for (const c of Object.values(byCategory)) {
    if (!byDimension[c.dimension]) {
      byDimension[c.dimension] = { dimension: c.dimension, totalDuration: 0, count: 0 };
    }
    byDimension[c.dimension].totalDuration += c.totalDuration;
    byDimension[c.dimension].count += c.count;
  }

  res.json({
    totalDuration,
    totalEntries: entries.length,
    byCategory: Object.values(byCategory),
    byDimension: Object.values(byDimension),
  });
});

// 创建时间记录
const createSchema = z.object({
  title: z.string().min(2).max(100),
  categoryId: z.string().uuid(),
  goalId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  note: z.string().max(500).optional(),
  tags: z.array(z.string()).max(5).optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = createSchema.parse(req.body);

    // 验证分类归属当前用户
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: req.userId },
    });
    if (!category) {
      return res.status(400).json({ error: '分类不存在或不属于当前用户' });
    }

    // 验证目标归属
    if (data.goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: data.goalId, userId: req.userId },
      });
      if (!goal) {
        return res.status(400).json({ error: '目标不存在或不属于当前用户' });
      }
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const duration = Math.round((end - start) / 1000);

    // date_key 按用户时区的当天日期
    const dateKey = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.userId,
        categoryId: data.categoryId,
        goalId: data.goalId,
        title: data.title,
        startTime: start,
        endTime: end,
        duration,
        note: data.note,
        tags: data.tags || [],
        dateKey,
      },
      include: { category: true },
    });

    res.status(201).json({ data: entry });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('创建时间记录失败:', err);
    res.status(500).json({ error: '创建失败' });
  }
});

// 更新时间记录
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 确保记录归属当前用户
    const existing = await prisma.timeEntry.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: req.body.categoryId, userId: req.userId },
      });
      if (!cat) return res.status(400).json({ error: '分类不存在' });
      updateData.categoryId = req.body.categoryId;
    }
    if (req.body.startTime) {
      updateData.startTime = new Date(req.body.startTime);
      updateData.dateKey = new Date(updateData.startTime.getFullYear(), updateData.startTime.getMonth(), updateData.startTime.getDate());
    }
    if (req.body.endTime) updateData.endTime = new Date(req.body.endTime);
    if (req.body.note !== undefined) updateData.note = req.body.note;
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.goalId !== undefined) updateData.goalId = req.body.goalId;

    // 重新计算时长
    if (updateData.startTime && updateData.endTime) {
      updateData.duration = Math.round((updateData.endTime - updateData.startTime) / 1000);
    } else if (updateData.startTime || updateData.endTime) {
      const s = updateData.startTime || existing.startTime;
      const e = updateData.endTime || existing.endTime;
      updateData.duration = Math.round((e - s) / 1000);
    }

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.json({ data: entry });
  } catch (err) {
    console.error('更新时间记录失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除时间记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.timeEntry.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: '记录不存在' });
    }

    await prisma.timeEntry.delete({ where: { id } });
    res.json({ message: '已删除' });
  } catch (err) {
    console.error('删除时间记录失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
