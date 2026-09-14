const { Router } = require('express');
const { z } = require('zod');
const { prisma } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

// 获取分类列表
router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ data: categories });
});

// 创建分类
router.post('/', async (req, res) => {
  try {
    const { name, dimension, color, icon } = req.body;
    if (!name || !dimension) {
      return res.status(400).json({ error: '名称和维度必填' });
    }
    const category = await prisma.category.create({
      data: { userId: req.userId, name, dimension, color: color || '#12B886', icon },
    });
    res.status(201).json({ data: category });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

// 更新分类
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });
    if (!cat) return res.status(404).json({ error: '分类不存在' });

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: req.body.name || cat.name,
        color: req.body.color || cat.color,
        icon: req.body.icon !== undefined ? req.body.icon : cat.icon,
        sortOrder: req.body.sortOrder !== undefined ? req.body.sortOrder : cat.sortOrder,
      },
    });
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除分类
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });
    if (!cat) return res.status(404).json({ error: '分类不存在' });
    if (cat.isDefault) return res.status(400).json({ error: '默认分类不可删除' });

    await prisma.category.delete({ where: { id } });
    res.json({ message: '已删除' });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
