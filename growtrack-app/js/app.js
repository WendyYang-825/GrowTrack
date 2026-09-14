const App = {
  charts: [],
  timerInterval: null,
  timerSeconds: 5075,

  init() {
    document.getElementById('menuBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('sidebar--open');
      document.getElementById('overlay').classList.toggle('overlay--visible');
    });

    document.getElementById('overlay').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('sidebar--open');
      document.getElementById('overlay').classList.remove('overlay--visible');
    });

    Router.register('dashboard', () => this.renderDashboard());
    Router.register('tracker', () => this.renderTracker());
    Router.register('dimensions', () => this.renderDimensions());
    Router.register('goals', () => this.renderGoals());
    Router.register('skills', () => this.renderSkills());
    Router.register('projects', () => this.renderProjects());
    Router.register('review', () => this.renderReview());
    Router.register('habits', () => this.renderHabits());

    Router.init();
  },

  clearCharts() {
    this.charts.forEach(c => { try { c.dispose(); } catch(e) {} });
    this.charts = [];
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  el(html) {
    const container = document.getElementById('pageContainer');
    container.innerHTML = html;
  },

  formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  },

  // ===== Dashboard =====
  renderDashboard() {
    this.clearCharts();
    const d = Store.dashboard;
    const user = Store.user;

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">今天，${new Date().getMonth()+1}月${new Date().getDate()}日</div>
          <div class="page-header__subtitle">周日 · 已专注 ${d.todayFocus}</div>
        </div>
        <button class="btn btn--primary" onclick="App.navigate('tracker')">+ 开始计时</button>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-card__label">专注时长</div>
          <div class="metric-card__value">${d.todayFocus}</div>
          <div class="metric-card__change metric-card__change--up">↑ ${d.todayChange}% vs 昨日</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">连续学习</div>
          <div class="metric-card__value">${user.streak} 天</div>
          <div class="metric-card__change metric-card__change--up">🔥 最长 30 天</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">本周目标</div>
          <div class="metric-card__value">${d.weekProgress}%</div>
          <div class="metric-card__change metric-card__change--neutral">${d.weekGoals.done}/${d.weekGoals.total} 完成</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">今日评分</div>
          <div class="metric-card__value">${d.todayScore}</div>
          <div class="metric-card__change metric-card__change--up">良好 ⭐⭐⭐⭐</div>
        </div>
      </div>

      <div class="tabs" id="dashTabs">
        <div class="tab tab--active" data-tab="today">今日</div>
        <div class="tab" data-tab="week">本周</div>
        <div class="tab" data-tab="month">本月</div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;" id="dashGrid">
        <div class="card">
          <div class="section-title">时间分布</div>
          <div id="pieChart" class="chart-container chart-container--sm"></div>
        </div>
        <div class="card">
          <div class="section-title">今日时间线</div>
          <ul class="activity-list">
            ${d.activities.map(a => `
              <li class="activity-item">
                <span class="activity-item__dot" style="background:${a.color}"></span>
                <span class="activity-item__name">${a.name}</span>
                <span class="activity-item__time">${a.start} - ${a.end}</span>
                <span class="activity-item__duration">${a.duration}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `);

    this.initPieChart(d.distribution);

    document.querySelectorAll('#dashTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('#dashTabs .tab').forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
      });
    });
  },

  initPieChart(data) {
    const el = document.getElementById('pieChart');
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}m ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '50%'],
        label: { fontSize: 11 },
        data: data.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      }],
    });
    this.charts.push(chart);
    window.addEventListener('resize', () => chart.resize());
  },

  // ===== Tracker =====
  renderTracker() {
    this.clearCharts();
    const t = Store.tracker;

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">时间追踪</div>
          <div class="page-header__subtitle">记录每一分钟的投入</div>
        </div>
      </div>

      <div class="timer-panel">
        <div class="timer-panel__label">正在进行</div>
        <div class="timer-panel__activity">
          <span class="tag tag--primary">${t.currentActivity.category}</span>
          ${t.currentActivity.title}
        </div>
        <div class="timer-display" id="timerDisplay">${this.formatTime(this.timerSeconds)}</div>
        <div class="timer-controls">
          <button class="btn btn--warning" id="pauseBtn">⏸ 暂停</button>
          <button class="btn btn--success" id="stopBtn">✓ 结束</button>
          <button class="btn btn--danger" id="cancelBtn">✕ 取消</button>
        </div>
      </div>

      <div class="card">
        <div class="section-title">快速开始</div>
        <div class="quick-start">
          ${t.quickStart.map(q => `
            <button class="btn" onclick="App.startQuickActivity('${q.label}','${q.dimension}')">${q.icon} ${q.label}</button>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="flex-between mb-md">
          <div class="section-title" style="margin:0">今日时间线</div>
          <span class="text-muted text-sm">共 ${t.timeline.length} 条记录</span>
        </div>
        <ul class="activity-list">
          ${t.timeline.map(a => `
            <li class="activity-item">
              <span class="activity-item__dot" style="background:${a.color}"></span>
              <span class="activity-item__name">
                ${a.name}
                ${a.tags.map(tag => `<span class="tag tag--info" style="margin-left:6px;font-size:10px;padding:1px 6px;">${tag}</span>`).join('')}
              </span>
              <span class="activity-item__time">${a.start} - ${a.end}</span>
              <span class="activity-item__duration">${a.duration}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `);

    this.startTimer();

    document.getElementById('pauseBtn').addEventListener('click', () => this.toggleTimer());
    document.getElementById('stopBtn').addEventListener('click', () => this.stopTimer());
    document.getElementById('cancelBtn').addEventListener('click', () => this.cancelTimer());
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const el = document.getElementById('timerDisplay');
      if (el) el.textContent = this.formatTime(this.timerSeconds);
    }, 1000);
  },

  toggleTimer() {
    const btn = document.getElementById('pauseBtn');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      btn.textContent = '▶ 继续';
      btn.classList.remove('btn--warning');
    } else {
      this.startTimer();
      btn.textContent = '⏸ 暂停';
      btn.classList.add('btn--warning');
    }
  },

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    const time = this.formatTime(this.timerSeconds);
    Store.tracker.timeline.unshift({
      id: Date.now(),
      color: '#228BE6',
      name: '编程开发 · ' + Store.tracker.currentActivity.title,
      start: new Date(Date.now() - this.timerSeconds * 1000).toTimeString().slice(0,5),
      end: new Date().toTimeString().slice(0,5),
      duration: time.replace(/^00:/, '').replace(/^0/, ''),
      tags: ['Just now'],
    });
    this.timerSeconds = 0;
    this.renderTracker();
  },

  cancelTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.timerSeconds = 0;
    const el = document.getElementById('timerDisplay');
    if (el) el.textContent = '00:00:00';
  },

  startQuickActivity(label, dimension) {
    Store.tracker.currentActivity = {
      category: label,
      title: '新的活动',
      startTime: Date.now(),
    };
    this.timerSeconds = 0;
    this.renderTracker();
  },

  // ===== Dimensions =====
  renderDimensions() {
    this.clearCharts();
    const d = Store.dimensions;

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">成长维度</div>
          <div class="page-header__subtitle">8大维度 · 全面量化你的成长</div>
        </div>
        <button class="btn">本周 ↓</button>
      </div>

      <div class="tabs" id="dimTabs">
        <div class="tab tab--active" data-tab="overview">概览</div>
        <div class="tab" data-tab="coding">编程技术</div>
        <div class="tab" data-tab="learning">学习输入</div>
        <div class="tab" data-tab="output">输出创作</div>
        <div class="tab" data-tab="exercise">健康运动</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="card">
          <div class="section-title">能力雷达图</div>
          <div id="radarChart" class="chart-container"></div>
        </div>
        <div class="card">
          <div class="section-title">各维度得分</div>
          ${d.overview.scores.map(s => `
            <div style="margin-bottom:14px;">
              <div class="flex-between" style="margin-bottom:4px;">
                <span style="font-size:13px;color:var(--ink-secondary);">${s.name}</span>
                <span style="font-size:13px;font-weight:600;color:${s.color};">${s.score}分</span>
              </div>
              <div class="progress-bar"><div class="progress-bar__fill" style="width:${s.score}%;background:${s.color};"></div></div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card mt-md">
        <div class="section-title">近7天总学习时长趋势</div>
        <div id="barChart" class="chart-container"></div>
      </div>
    `);

    this.initRadarChart(d.overview.radar);
    this.initBarChart(d.weekly);

    document.querySelectorAll('#dimTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('#dimTabs .tab').forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
      });
    });
  },

  initRadarChart(data) {
    const el = document.getElementById('radarChart');
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'item' },
      radar: {
        indicator: data.map(d => ({ name: d.name, max: d.max })),
        axisName: { color: '#6B8A81', fontSize: 12 },
        splitArea: { areaStyle: { color: ['rgba(18,184,134,0.02)', 'rgba(18,184,134,0.06)'] } },
        splitLine: { lineStyle: { color: '#CFE1DB' } },
        axisLine: { lineStyle: { color: '#CFE1DB' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: data.map(d => d.value),
          name: '本周',
          areaStyle: { color: 'rgba(18,184,134,0.15)' },
          lineStyle: { color: '#12B886', width: 2 },
          itemStyle: { color: '#12B886' },
        }],
      }],
    });
    this.charts.push(chart);
    window.addEventListener('resize', () => chart.resize());
  },

  initBarChart(data) {
    const el = document.getElementById('barChart');
    if (!el) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c}h' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.day),
        axisLine: { lineStyle: { color: '#CFE1DB' } },
        axisLabel: { color: '#6B8A81', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        name: '小时',
        nameTextStyle: { color: '#6B8A81', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#6B8A81', fontSize: 11 },
        splitLine: { lineStyle: { color: '#E6F4EF' } },
      },
      series: [{
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.hours,
          itemStyle: {
            color: i >= 5 ? '#228BE6' : '#12B886',
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '40%',
      }],
    });
    this.charts.push(chart);
    window.addEventListener('resize', () => chart.resize());
  },

  // ===== Goals =====
  renderGoals() {
    this.clearCharts();
    const g = Store.goals;

    const statusTag = {
      active: '<span class="tag tag--success">进行中</span>',
      pending: '<span class="tag">待开始</span>',
      completed: '<span class="tag tag--primary" style="background:rgba(18,184,134,0.15);color:var(--brand);">已完成</span>',
    };

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">目标管理</div>
          <div class="page-header__subtitle">让每一天都向目标靠近</div>
        </div>
        <button class="btn btn--primary">+ 新建目标</button>
      </div>

      <div class="card" style="background:linear-gradient(135deg,rgba(18,184,134,0.1),rgba(34,139,230,0.1));border-color:var(--brand-soft-strong);">
        <div class="flex-between" style="align-items:flex-start;">
          <div>
            <span class="tag tag--primary mb-sm">🎓 N1 AI School 申请</span>
            <div style="font-size:18px;font-weight:700;color:var(--ink);margin-top:6px;">${g.mainGoal.title}</div>
            <div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">截止日期：${g.mainGoal.deadline} · 剩余 ${g.mainGoal.daysLeft} 天</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:24px;font-weight:700;color:var(--brand-text);">${g.mainGoal.progress}%</div>
            <div style="font-size:11px;color:var(--ink-muted);">总体进度</div>
          </div>
        </div>
        <div class="progress-bar progress-bar--lg mt-md"><div class="progress-bar__fill" style="width:${g.mainGoal.progress}%;"></div></div>
      </div>

      <div class="section-title mt-lg">本周目标</div>
      ${g.weekly.map(goal => `
        <div class="goal-card">
          <div class="goal-card__header">
            <div>
              ${statusTag[goal.status] || ''}
              <span class="goal-card__title" style="margin-left:6px;">${goal.title}</span>
            </div>
            <span class="text-muted text-sm">${goal.detail}</span>
          </div>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${goal.progress}%;${goal.status==='completed'?'background:var(--brand);':''}"></div></div>
          <div class="goal-card__meta">
            <span>${goal.dimension}</span>
            <span>累计 ${goal.hours}</span>
            <span>截止：${goal.deadline}</span>
          </div>
        </div>
      `).join('')}
    `);
  },

  // ===== Skills =====
  renderSkills() {
    this.clearCharts();
    const s = Store.skills;

    const skillTag = (skill) => {
      if (skill.status === 'mastered') return `<span class="tag tag--success" style="background:rgba(18,184,134,0.15);">Lv.${skill.level}</span>`;
      if (skill.status === 'active') return `<span class="tag tag--primary">Lv.${skill.level}</span>`;
      return `<span class="tag" style="opacity:0.5;">Lv.0</span>`;
    };

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">${s.roadmap.title}</div>
          <div class="page-header__subtitle">${s.roadmap.subtitle} · 整体进度 ${s.roadmap.progress}%</div>
        </div>
        <button class="btn">切换路线 ↓</button>
      </div>

      <div class="card mb-md">
        <div class="flex-between mb-sm">
          <span style="font-size:13px;color:var(--ink-secondary);font-weight:500;">总体进度</span>
          <span style="font-size:13px;color:var(--brand-text);font-weight:600;">${s.roadmap.progress}%</span>
        </div>
        <div class="progress-bar progress-bar--lg"><div class="progress-bar__fill" style="width:${s.roadmap.progress}%;"></div></div>
      </div>

      <div class="tabs">
        <div class="tab tab--active">技能树</div>
        <div class="tab">学习记录</div>
        <div class="tab">推荐挑战</div>
      </div>

      ${s.tiers.map(tier => `
        <div class="skill-tier">
          <div class="skill-tier__header">
            <span class="skill-tier__bar" style="background:${tier.color};"></span>
            <span class="skill-tier__title">${tier.name}</span>
            <span class="skill-tier__status" style="color:${tier.color};">${tier.status}</span>
          </div>
          <div class="skill-tier__skills">
            ${tier.skills.map(skill => skillTag(skill)).join('')}
          </div>
        </div>
      `).join('')}

      <div class="callout" style="background:linear-gradient(135deg,rgba(121,80,242,0.06),rgba(18,184,134,0.06));border-color:var(--brand-soft-strong);">
        <div class="callout__title">💡 下一步推荐</div>
        <p style="margin-bottom:12px;">
          ${s.recommendation.reason}<br>
          建议开始学习 <strong style="color:var(--ink);">${s.recommendation.skill}</strong>
        </p>
        <div style="display:flex;gap:8px;">
          <button class="btn btn--primary btn--sm">开始学习</button>
          <button class="btn btn--sm">查看详情</button>
        </div>
      </div>
    `);
  },

  // ===== Projects =====
  renderProjects() {
    this.clearCharts();
    const p = Store.projects;
    const diffColor = { 1: 'success', 2: 'info', 3: 'warning', 4: 'pink' };

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">项目制挑战</div>
          <div class="page-header__subtitle">在实战中检验你的技能水平</div>
        </div>
        <button class="btn btn--primary">+ 自定义项目</button>
      </div>

      <div class="tabs" id="projTabs">
        <div class="tab tab--active">为你推荐</div>
        <div class="tab">进行中</div>
        <div class="tab">已完成</div>
        <div class="tab">全部挑战</div>
      </div>

      <div class="card" style="background:linear-gradient(135deg,rgba(18,184,134,0.1),rgba(121,80,242,0.08));border-color:var(--brand-soft-strong);">
        <div class="flex-between" style="align-items:flex-start;margin-bottom:10px;">
          <div>
            <span class="tag tag--primary mb-sm">⭐ 推荐 · 匹配度 ${p.featured.matchScore}%</span>
            <div style="font-size:16px;font-weight:700;color:var(--ink);margin-top:6px;">${p.featured.title}</div>
            <div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">${p.featured.description}</div>
          </div>
          <span class="tag tag--info">${p.featured.difficultyLabel}</span>
        </div>
        <div class="flex gap-md text-sm text-muted mb-sm">
          <span>⏱ ${p.featured.estHours}</span>
          <span>📚 ${p.featured.skill}</span>
          <span>🏅 ${p.featured.xp} XP</span>
        </div>
        <div style="font-size:12px;color:var(--ink-muted);margin-bottom:10px;">
          <strong style="color:var(--ink-secondary);">为什么推荐：</strong>${p.featured.reason}
        </div>
        <button class="btn btn--primary btn--sm">开始挑战 →</button>
      </div>

      <div class="section-title mt-lg">更多推荐</div>
      ${p.list.map(proj => `
        <div class="goal-card">
          <div class="goal-card__header">
            <div>
              <span class="tag tag--${diffColor[proj.difficulty] || ''}" style="margin-right:6px;">${proj.diffLabel}</span>
              <span class="goal-card__title">${proj.title}</span>
            </div>
            <span class="text-muted text-sm">${proj.xp} XP</span>
          </div>
          <div style="font-size:12px;color:var(--ink-muted);margin-top:4px;">
            ${proj.desc} · ${proj.skill} · 预计 ${proj.hours}
          </div>
        </div>
      `).join('')}

      <div class="section-title mt-lg">🏅 最近完成</div>
      ${p.completed.map(c => `
        <div class="goal-card" style="background:var(--bg-soft);">
          <div class="goal-card__header">
            <div>
              <span class="tag tag--success" style="margin-right:6px;">已完成 · 评分 ${c.score}</span>
              <span class="goal-card__title">${c.title}</span>
            </div>
            <span style="color:var(--brand);font-weight:600;font-size:13px;">+${c.xp} XP</span>
          </div>
          <div style="font-size:11px;color:var(--ink-muted);margin-top:6px;margin-bottom:8px;">
            ${c.breakdown.map(b => `${b.name} ${b.score}`).join(' · ')}
          </div>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${c.score}%;"></div></div>
        </div>
      `).join('')}
    `);

    document.querySelectorAll('#projTabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('#projTabs .tab').forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
      });
    });
  },

  // ===== Review =====
  renderReview() {
    this.clearCharts();
    const r = Store.review;

    const insightColors = {
      success: '',
      warning: 'callout--warning',
      info: 'callout--info',
    };

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">第37周成长报告</div>
          <div class="page-header__subtitle">${r.weekRange} · 自动生成于今天 08:00</div>
        </div>
        <div class="flex gap-sm">
          <button class="btn">分享</button>
          <button class="btn">导出 PDF</button>
        </div>
      </div>

      <div class="metric-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="metric-card">
          <div class="metric-card__label">总投入时长</div>
          <div class="metric-card__value">${r.summary.totalHours}</div>
          <div class="metric-card__change metric-card__change--up">↑ ${r.summary.totalChange}% vs 上周</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">日均专注</div>
          <div class="metric-card__value">${r.summary.dailyAvg}</div>
          <div class="metric-card__change metric-card__change--up">↑ ${r.summary.dailyChange}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">目标完成率</div>
          <div class="metric-card__value">${r.summary.goalCompletion}%</div>
          <div class="metric-card__change metric-card__change--up">↑ ${r.summary.goalChange}%</div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">年度学习热力图</div>
        <div class="heatmap" id="heatmap"></div>
        <div class="heatmap__legend">
          <span>少</span>
          <div class="heatmap__cell"></div>
          <div class="heatmap__cell heatmap__cell--l1"></div>
          <div class="heatmap__cell heatmap__cell--l2"></div>
          <div class="heatmap__cell heatmap__cell--l3"></div>
          <div class="heatmap__cell heatmap__cell--l4"></div>
          <span>多</span>
        </div>
      </div>

      <div class="card">
        <div class="section-title">维度对比（本周 vs 上周）</div>
        <div id="compareChart" class="chart-container"></div>
      </div>

      <div class="section-title mt-lg">💡 本周洞察</div>
      ${r.insights.map(i => `
        <div class="callout ${insightColors[i.type] || ''}">
          <div class="callout__title">${i.title}</div>
          <p>${i.text}</p>
        </div>
      `).join('')}
    `);

    this.renderHeatmap(r.heatmap);
    this.initCompareChart(r.dimensionComparison);
  },

  renderHeatmap(data) {
    const el = document.getElementById('heatmap');
    if (!el) return;
    const classMap = ['', 'heatmap__cell--l1', 'heatmap__cell--l2', 'heatmap__cell--l3', 'heatmap__cell--l4'];
    let html = '';
    for (let week = 0; week < 20; week++) {
      html += '<div style="display:flex;flex-direction:column;gap:3px;">';
      for (let day = 0; day < 7; day++) {
        const level = data[week * 7 + day] || 0;
        html += `<div class="heatmap__cell ${classMap[level]}" title="Level ${level}"></div>`;
      }
      html += '</div>';
    }
    el.innerHTML = html;
  },

  initCompareChart(data) {
    const el = document.getElementById('compareChart');
    if (!el) return;
    const chart = echarts.init(el);
    const indicators = ['编程','学习','输出','运动','阅读','专注'];
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { data: data.map(d => d.name), bottom: 0, textStyle: { fontSize: 12 } },
      radar: {
        indicator: indicators.map(n => ({ name: n, max: 100 })),
        axisName: { color: '#6B8A81', fontSize: 12 },
        splitLine: { lineStyle: { color: '#CFE1DB' } },
        axisLine: { lineStyle: { color: '#CFE1DB' } },
      },
      series: [{
        type: 'radar',
        data: data.map(d => ({
          value: d.data,
          name: d.name,
          areaStyle: { color: d.name === '本周' ? 'rgba(18,184,134,0.12)' : 'rgba(156,179,172,0.08)' },
          lineStyle: { color: d.color, width: 2 },
          itemStyle: { color: d.color },
        })),
      }],
    });
    this.charts.push(chart);
    window.addEventListener('resize', () => chart.resize());
  },

  // ===== Habits =====
  renderHabits() {
    this.clearCharts();
    const h = Store.habits;

    this.el(`
      <div class="page-header">
        <div>
          <div class="page-header__title">习惯打卡</div>
          <div class="page-header__subtitle">坚持的力量 · 今日 ${h.list.filter(x=>x.doneToday).length}/${h.list.length} 完成</div>
        </div>
        <button class="btn btn--primary">+ 新建习惯</button>
      </div>

      <div class="tabs">
        <div class="tab tab--active">今日</div>
        <div class="tab">日历</div>
        <div class="tab">习惯管理</div>
      </div>

      <div class="metric-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="metric-card">
          <div class="metric-card__label">今日完成</div>
          <div class="metric-card__value">${h.list.filter(x=>x.doneToday).length}/${h.list.length}</div>
          <div class="metric-card__change metric-card__change--neutral">继续加油</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">最长连续</div>
          <div class="metric-card__value">${Math.max(...h.list.map(x=>x.streak))} 天</div>
          <div class="metric-card__change metric-card__change--up">🔥 背单词</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">总习惯数</div>
          <div class="metric-card__value">${h.list.length}</div>
          <div class="metric-card__change metric-card__change--neutral">本周新增 0</div>
        </div>
      </div>

      <div class="section-title mt-lg">今日习惯</div>
      ${h.list.map(habit => `
        <div class="goal-card" onclick="App.toggleHabit(${habit.id})" style="cursor:pointer;">
          <div class="goal-card__header">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:20px;">${habit.icon}</span>
              <div>
                <div class="goal-card__title">${habit.name}</div>
                <div style="font-size:11px;color:var(--ink-muted);margin-top:2px;">
                  ${habit.freq} · 🔥 连续 ${habit.streak} 天
                </div>
              </div>
            </div>
            <div style="width:28px;height:28px;border-radius:50%;border:2px solid ${habit.doneToday ? habit.color : 'var(--border)'};background:${habit.doneToday ? habit.color : 'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;">
              ${habit.doneToday ? '<span style="color:#fff;font-size:14px;">✓</span>' : ''}
            </div>
          </div>
        </div>
      `).join('')}

      <div class="section-title mt-lg">打卡日历（近30天）</div>
      <div class="card">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
          ${['日','一','二','三','四','五','六'].map(d => `<div class="text-center text-sm text-muted" style="padding:4px 0;">${d}</div>`).join('')}
          ${h.calendar.map(c => `
            <div style="
              aspect-ratio:1;
              border-radius:6px;
              background:${c.completed ? 'var(--brand-soft-strong)' : 'var(--bg-soft)'};
              border:${c.isToday ? '2px solid var(--brand)' : '1px solid var(--border)'};
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:11px;
              color:${c.completed ? 'var(--brand-text)' : 'var(--ink-muted)'};
              font-weight:${c.isToday ? '700' : '400'};
            ">${c.day}</div>
          `).join('')}
        </div>
      </div>
    `);
  },

  toggleHabit(id) {
    const habit = Store.habits.list.find(h => h.id === id);
    if (habit) {
      habit.doneToday = !habit.doneToday;
      habit.streak = habit.doneToday ? habit.streak + 1 : Math.max(0, habit.streak - 1);
      this.renderHabits();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
