const { Router } = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// 获取目标列表
router.get('/', async (req, res) => {
  const { status, type, parentId } = req.query;
  const where = { userId: req.userId };
  if (status) where.status = status;
  if (type) where.type = type;
  if (parentId) where.parentId = parentId;

  const goals = await prisma.goal.findMany({
    where,
    include: {
      _count: { select: { timeEntries: true } },
      children: true,
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  // 计算每个目标的实际投入时长
  const goalsWithStats = await Promise.all(
    goals.map(async (g) => {
      const stats = await prisma.timeEntry.aggregate({
        where: { goalId: g.id, userId: req.userId },
        _sum: { duration: true },
      });
      return {
        ...g,
        spentDuration: stats._sum.duration || 0,
      };
    })
  );

  res.json({ data: goalsWithStats });
});

// 创建目标
const createGoalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['long_term', 'weekly', 'monthly', 'milestone']).default('weekly'),
  parentId: z.string().uuid().optional(),
  dimension: z.string().optional(),
  targetDuration: z.number().int().positive().optional(),
  targetCount: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = createGoalSchema.parse(req.body);

    // 验证父目标归属
    if (data.parentId) {
      const parent = await prisma.goal.findFirst({
        where: { id: data.parentId, userId: req.userId },
      });
      if (!parent) return res.status(400).json({ error: '父目标不存在' });
    }

    const goal = await prisma.goal.create({
      data: {
        ...data,
        userId: req.userId,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    res.status(201).json({ data: goal });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: '创建目标失败' });
  }
});

// 更新目标
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });
    if (!goal) return res.status(404).json({ error: '目标不存在' });

    const updateData = {};
    const allowed = ['title', 'description', 'type', 'status', 'dimension', 'targetDuration', 'targetCount', 'deadline', 'sortOrder'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) updateData[k] = req.body[k];
    }
    if (updateData.deadline) updateData.deadline = new Date(updateData.deadline);
    if (req.body.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除目标
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });
    if (!goal) return res.status(404).json({ error: '目标不存在' });

    await prisma.goal.delete({ where: { id } });
    res.json({ message: '已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
