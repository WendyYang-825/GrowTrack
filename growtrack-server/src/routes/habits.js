const { Router } = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// 获取习惯列表（含今日打卡状态和连续天数）
router.get('/', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const habitsWithStats = await Promise.all(
    habits.map(async (h) => {
      // 今日是否已打卡
      const todayLog = await prisma.habitLog.findUnique({
        where: { habitId_checkDate: { habitId: h.id, checkDate: todayDate } },
      });

      // 计算连续天数
      let streak = 0;
      const checkDate = new Date(todayDate);
      while (true) {
        const log = await prisma.habitLog.findUnique({
          where: { habitId_checkDate: { habitId: h.id, checkDate } },
        });
        if (log) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        ...h,
        doneToday: !!todayLog,
        streak,
      };
    })
  );

  res.json({ data: habitsWithStats });
});

// 创建习惯
const createHabitSchema = z.object({
  name: z.string().min(1).max(50),
  dimension: z.string().default('other'),
  frequencyType: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  frequencyValue: z.number().int().optional(),
  icon: z.string().optional(),
  color: z.string().default('#12B886'),
  reminderTime: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = createHabitSchema.parse(req.body);
    const habit = await prisma.habit.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json({ data: habit });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: '创建习惯失败' });
  }
});

// 打卡
router.post('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.userId, isActive: true },
    });
    if (!habit) return res.status(404).json({ error: '习惯不存在' });

    const today = new Date();
    const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 检查是否已打卡
    const existing = await prisma.habitLog.findUnique({
      where: { habitId_checkDate: { habitId: id, checkDate } },
    });
    if (existing) {
      return res.status(409).json({ error: '今日已打卡' });
    }

    const log = await prisma.habitLog.create({
      data: {
        habitId: id,
        userId: req.userId,
        checkDate,
        note: req.body.note,
      },
    });

    res.status(201).json({ data: log, message: '打卡成功' });
  } catch (err) {
    res.status(500).json({ error: '打卡失败' });
  }
});

// 取消打卡
router.delete('/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();
    const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const log = await prisma.habitLog.findUnique({
      where: { habitId_checkDate: { habitId: id, checkDate } },
    });

    if (!log || log.userId !== req.userId) {
      return res.status(404).json({ error: '打卡记录不存在' });
    }

    await prisma.habitLog.delete({ where: { id: log.id } });
    res.json({ message: '已取消打卡' });
  } catch (err) {
    res.status(500).json({ error: '取消打卡失败' });
  }
});

// 获取打卡日历（指定月份）
router.get('/:id/calendar', async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    const habit = await prisma.habit.findFirst({
      where: { id, userId: req.userId },
    });
    if (!habit) return res.status(404).json({ error: '习惯不存在' });

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: id,
        userId: req.userId,
        checkDate: { gte: startDate, lte: endDate },
      },
      orderBy: { checkDate: 'asc' },
    });

    res.json({ data: logs });
  } catch (err) {
    res.status(500).json({ error: '获取日历失败' });
  }
});

module.exports = router;
