const Store = {
  user: {
    name: '学习者',
    email: 'user@growtrack.com',
    streak: 23,
    joinedAt: '2026-07-22',
    goal: 'N1 AI School 2027春季入学申请',
    goalDeadline: '2027-01-15',
    goalDaysLeft: 124,
  },

  dashboard: {
    todayFocus: '4h 25m',
    todayChange: 12,
    weekProgress: 65,
    weekGoals: { done: 3, total: 5 },
    todayScore: 82,
    distribution: [
      { name: '编程开发', value: 105, color: '#12B886' },
      { name: '课程学习', value: 80, color: '#228BE6' },
      { name: '阅读输入', value: 50, color: '#7950F2' },
      { name: '运动健康', value: 30, color: '#E64980' },
    ],
    activities: [
      { id: 1, cat: 'code', color: '#228BE6', name: '编程开发 · 机器学习项目', start: '09:30', end: '11:15', duration: '1h 45m' },
      { id: 2, cat: 'study', color: '#12B886', name: '课程学习 · 深度学习专项课', start: '13:00', end: '14:20', duration: '1h 20m' },
      { id: 3, cat: 'read', color: '#7950F2', name: '阅读 · 《深度学习》第5章', start: '14:30', end: '15:20', duration: '50m' },
      { id: 4, cat: 'exercise', color: '#E64980', name: '运动 · 跑步5km', start: '17:00', end: '17:30', duration: '30m' },
    ],
  },

  tracker: {
    currentActivity: {
      category: '编程开发',
      title: '机器学习项目 - 数据预处理',
      startTime: Date.now() - 5075000,
    },
    quickStart: [
      { icon: '💻', label: '编程', dimension: 'coding' },
      { icon: '📚', label: '学习', dimension: 'learning' },
      { icon: '📖', label: '阅读', dimension: 'reading' },
      { icon: '✍️', label: '写作', dimension: 'writing' },
      { icon: '🏃', label: '运动', dimension: 'exercise' },
      { icon: '🎯', label: '刷题', dimension: 'coding' },
    ],
    timeline: [
      { id: 1, color: '#228BE6', name: '编程开发 · 机器学习项目', start: '09:30', end: '11:15', duration: '1h 45m', tags: ['Python', 'ML'] },
      { id: 2, color: '#12B886', name: '课程学习 · 深度学习专项课', start: '13:00', end: '14:20', duration: '1h 20m', tags: ['Coursera'] },
      { id: 3, color: '#7950F2', name: '阅读 · 《深度学习》第5章', start: '14:30', end: '15:20', duration: '50m', tags: ['Book'] },
      { id: 4, color: '#E64980', name: '运动 · 跑步5km', start: '17:00', end: '17:30', duration: '30m', tags: ['Running'] },
    ],
  },

  dimensions: {
    overview: {
      radar: [
        { name: '编程', value: 85, max: 100 },
        { name: '学习', value: 72, max: 100 },
        { name: '输出', value: 60, max: 100 },
        { name: '运动', value: 55, max: 100 },
        { name: '阅读', value: 78, max: 100 },
        { name: '专注', value: 80, max: 100 },
      ],
      scores: [
        { name: '💻 编程技术', score: 85, color: '#12B886' },
        { name: '📚 学习输入', score: 72, color: '#228BE6' },
        { name: '✍️ 输出创作', score: 60, color: '#7950F2' },
        { name: '📖 阅读积累', score: 78, color: '#E64980' },
        { name: '🏃 健康运动', score: 55, color: '#FF7A45' },
        { name: '🎯 专注质量', score: 80, color: '#FAAD14' },
      ],
    },
    weekly: [
      { day: '周一', hours: 4.5 },
      { day: '周二', hours: 5.8 },
      { day: '周三', hours: 3.7 },
      { day: '周四', hours: 6.6 },
      { day: '周五', hours: 5.3 },
      { day: '周六', hours: 7.4 },
      { day: '周日', hours: 6.2 },
    ],
  },

  goals: {
    mainGoal: {
      title: '2027春季入学申请',
      subtitle: 'N1 AI School',
      progress: 68,
      deadline: '2027-01-15',
      daysLeft: 124,
    },
    weekly: [
      { id: 1, status: 'active', title: '完成吴恩达机器学习课程 Week 5-6', dimension: '📚 学习输入', progress: 50, detail: '3/6 节', hours: '6h 20m', deadline: '本周日' },
      { id: 2, status: 'pending', title: '完成第一个机器学习项目：房价预测', dimension: '💻 编程技术', progress: 0, detail: '0%', hours: '预计 8h', deadline: '下周日' },
      { id: 3, status: 'completed', title: 'LeetCode 刷题 20 道', dimension: '🎯 算法练习', progress: 100, detail: '20/20', hours: '5h 30m', deadline: '提前2天完成' },
      { id: 4, status: 'active', title: '阅读《深度学习》第5-7章', dimension: '📖 阅读积累', progress: 40, detail: '2/3 章', hours: '3h 10m', deadline: '本周日' },
      { id: 5, status: 'active', title: '每日运动30分钟（5天）', dimension: '🏃 健康运动', progress: 80, detail: '4/5 天', hours: '2h 00m', deadline: '本周日' },
    ],
  },

  skills: {
    roadmap: {
      title: 'AI 工程师路线图',
      subtitle: 'N1 AI School 推荐路径',
      progress: 35,
    },
    tiers: [
      {
        name: '基础层 · 编程基础',
        color: '#12B886',
        status: '已掌握',
        statusType: 'success',
        skills: [
          { name: 'Python', level: 5, maxLevel: 5, status: 'mastered' },
          { name: '数据结构', level: 3, maxLevel: 5, status: 'mastered' },
          { name: 'Git', level: 4, maxLevel: 5, status: 'mastered' },
        ],
      },
      {
        name: '进阶层 · 机器学习',
        color: '#228BE6',
        status: '进行中 60%',
        statusType: 'primary',
        skills: [
          { name: '机器学习基础', level: 3, maxLevel: 5, status: 'active' },
          { name: '深度学习', level: 2, maxLevel: 5, status: 'active' },
          { name: '强化学习', level: 0, maxLevel: 5, status: 'locked' },
          { name: 'NLP', level: 0, maxLevel: 5, status: 'locked' },
          { name: 'CV', level: 0, maxLevel: 5, status: 'locked' },
        ],
      },
      {
        name: '应用层 · 项目实践',
        color: '#7950F2',
        status: '未解锁',
        statusType: 'muted',
        skills: [
          { name: '端到端项目', level: 0, maxLevel: 5, status: 'locked' },
          { name: 'MLOps', level: 0, maxLevel: 5, status: 'locked' },
          { name: '论文复现', level: 0, maxLevel: 5, status: 'locked' },
        ],
      },
    ],
    recommendation: {
      skill: '深度学习 - 神经网络基础',
      reason: '你已掌握机器学习基础，建议开始学习深度学习核心内容',
    },
  },

  projects: {
    featured: {
      title: '房价预测模型',
      matchScore: 92,
      difficulty: 2,
      difficultyLabel: 'Lv.2 进阶',
      description: '基于波士顿房价数据集，训练一个回归预测模型',
      estHours: '6-8 小时',
      skill: '机器学习基础',
      xp: 120,
      reason: '你已掌握 Python 和机器学习基础（Lv.3），正好适合用一个完整项目巩固知识',
    },
    list: [
      { id: 1, difficulty: 1, diffLabel: 'Lv.1 入门', title: 'Todo List Web 应用', desc: '用 HTML/CSS/JS 做一个完整的 Todo 应用', skill: '前端基础', hours: '3h', xp: 80, color: 'success' },
      { id: 2, difficulty: 3, diffLabel: 'Lv.3 进阶', title: '手写数字识别', desc: '用 CNN 实现 MNIST 手写数字识别', skill: '深度学习', hours: '10h', xp: 200, color: 'warning' },
      { id: 3, difficulty: 4, diffLabel: 'Lv.4 高阶', title: '聊天机器人', desc: '基于大模型 API 打造一个有记忆的聊天机器人', skill: 'NLP', hours: '15h', xp: 350, color: 'pink' },
      { id: 4, difficulty: 2, diffLabel: 'Lv.2 进阶', title: '数据分析可视化', desc: '对真实数据集做分析和可视化报告', skill: '数据分析', hours: '5h', xp: 100, color: 'info' },
    ],
    completed: [
      {
        title: '数据分析可视化项目',
        score: 85,
        xp: 100,
        breakdown: [
          { name: '功能完整度', score: 90, weight: '30%' },
          { name: '代码质量', score: 82, weight: '25%' },
          { name: '文档质量', score: 85, weight: '15%' },
          { name: '创新度', score: 83, weight: '20%' },
          { name: '时长合理性', score: 85, weight: '10%' },
        ],
      },
    ],
  },

  review: {
    weekRange: '9月8日 - 9月14日',
    summary: {
      totalHours: '32h 15m',
      totalChange: 8,
      dailyAvg: '4h 36m',
      dailyChange: 5,
      goalCompletion: 75,
      goalChange: 15,
    },
    heatmap: generateHeatmapData(),
    insights: [
      { type: 'success', title: '亮点', text: '编程时长较上周提升23%，连续学习天数达到23天，保持良好势头。' },
      { type: 'warning', title: '改进', text: '运动健康维度得分仅55分，建议每天安排至少20分钟运动，保持精力充沛。' },
      { type: 'info', title: '建议', text: '输出创作维度投入不足（本周仅2小时），尝试每周写一篇学习笔记，加深理解的同时积累作品集。' },
    ],
    dimensionComparison: [
      { name: '本周', data: [85, 72, 60, 55, 78, 80], color: '#12B886' },
      { name: '上周', data: [69, 68, 65, 60, 75, 72], color: '#9CB3AC' },
    ],
  },

  habits: {
    list: [
      { id: 1, icon: '🌅', name: '早起 (7:00前)', color: '#FAAD14', streak: 12, doneToday: true, freq: '每天' },
      { id: 2, icon: '📚', name: '背单词 30个', color: '#228BE6', streak: 23, doneToday: true, freq: '每天' },
      { id: 3, icon: '📖', name: '阅读 30分钟', color: '#7950F2', streak: 8, doneToday: true, freq: '每天' },
      { id: 4, icon: '🏃', name: '运动 30分钟', color: '#E64980', streak: 4, doneToday: false, freq: '5天/周' },
      { id: 5, icon: '✍️', name: '写日记', color: '#12B886', streak: 15, doneToday: true, freq: '每天' },
      { id: 6, icon: '🧘', name: '冥想 10分钟', color: '#7950F2', streak: 0, doneToday: false, freq: '每天' },
    ],
    calendar: generateHabitCalendar(),
  },
};

function generateHeatmapData() {
  const data = [];
  for (let i = 0; i < 20 * 7; i++) {
    const level = Math.floor(Math.random() * 5);
    data.push(level);
  }
  return data;
}

function generateHabitCalendar() {
  const days = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      day: d.getDate(),
      weekday: d.getDay(),
      isToday: i === 0,
      completed: Math.random() > 0.3,
    });
  }
  return days;
}
