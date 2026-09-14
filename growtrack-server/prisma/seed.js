const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  // 创建测试用户
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@growtrack.com' },
    update: {},
    create: {
      email: 'test@growtrack.com',
      passwordHash,
      nickname: '测试用户',
      timezone: 'Asia/Shanghai',
    },
  });

  console.log('用户已创建:', user.email);

  // 创建默认分类
  const categories = [
    { name: '编程开发', dimension: 'coding', color: '#228BE6', icon: '💻' },
    { name: '课程学习', dimension: 'learning', color: '#12B886', icon: '📚' },
    { name: '阅读输入', dimension: 'reading', color: '#7950F2', icon: '📖' },
    { name: '输出创作', dimension: 'writing', color: '#E64980', icon: '✍️' },
    { name: '运动健康', dimension: 'exercise', color: '#FF7A45', icon: '🏃' },
    { name: '专注冥想', dimension: 'focus', color: '#FAAD14', icon: '🧘' },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: 'seed-cat-' + c.dimension + '-' + user.id },
      update: {},
      create: {
        id: 'seed-cat-' + c.dimension + '-' + user.id,
        ...c,
        userId: user.id,
        isDefault: true,
      },
    });
  }

  console.log('分类已创建:', categories.length);

  // 创建目标
  const mainGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: '2027春季入学申请',
      description: 'N1 AI School 申请',
      type: 'long_term',
      status: 'active',
      deadline: new Date('2027-01-15'),
    },
  });

  await prisma.goal.createMany({
    data: [
      { userId: user.id, parentId: mainGoal.id, title: '完成吴恩达机器学习课程 Week 5-6', type: 'weekly', status: 'active', dimension: 'learning', deadline: new Date('2026-09-14') },
      { userId: user.id, parentId: mainGoal.id, title: '完成机器学习项目：房价预测', type: 'weekly', status: 'pending', dimension: 'coding', deadline: new Date('2026-09-21') },
      { userId: user.id, parentId: mainGoal.id, title: 'LeetCode 刷题 20 道', type: 'weekly', status: 'completed', dimension: 'coding', completedAt: new Date() },
    ],
  });

  console.log('目标已创建');

  // 创建习惯
  await prisma.habit.createMany({
    data: [
      { userId: user.id, name: '早起 (7:00前)', dimension: 'focus', icon: '🌅', color: '#FAAD14' },
      { userId: user.id, name: '背单词 30个', dimension: 'learning', icon: '📚', color: '#228BE6' },
      { userId: user.id, name: '阅读 30分钟', dimension: 'reading', icon: '📖', color: '#7950F2' },
      { userId: user.id, name: '运动 30分钟', dimension: 'exercise', frequencyType: 'weekly', frequencyValue: 5, icon: '🏃', color: '#E64980' },
      { userId: user.id, name: '写日记', dimension: 'writing', icon: '✍️', color: '#12B886' },
    ],
  });

  console.log('习惯已创建');

  // 创建最近几条时间记录
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const codingCat = await prisma.category.findFirst({ where: { userId: user.id, dimension: 'coding' } });
  const learningCat = await prisma.category.findFirst({ where: { userId: user.id, dimension: 'learning' } });

  if (codingCat && learningCat) {
    await prisma.timeEntry.createMany({
      data: [
        {
          userId: user.id,
          categoryId: codingCat.id,
          title: '编程开发 · 机器学习项目',
          startTime: new Date(todayStart.getTime() + 9.5 * 3600 * 1000),
          endTime: new Date(todayStart.getTime() + 11.25 * 3600 * 1000),
          duration: 6300,
          dateKey: todayStart,
          tags: ['Python', 'ML'],
        },
        {
          userId: user.id,
          categoryId: learningCat.id,
          title: '课程学习 · 深度学习专项课',
          startTime: new Date(todayStart.getTime() + 13 * 3600 * 1000),
          endTime: new Date(todayStart.getTime() + 14.33 * 3600 * 1000),
          duration: 4800,
          dateKey: todayStart,
          tags: ['Coursera'],
        },
      ],
    });
  }

  console.log('时间记录已创建');
  console.log('初始化完成！');
  console.log('测试账号: test@growtrack.com');
  console.log('密码: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
