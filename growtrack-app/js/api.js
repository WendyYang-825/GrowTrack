const API = {
  baseURL: 'https://growtrack-production-ec97.up.railway.app/api',

  getToken() {
    return localStorage.getItem('growtrack_token');
  },

  getRefreshToken() {
    return localStorage.getItem('growtrack_refresh_token');
  },

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('growtrack_token', accessToken);
    if (refreshToken) localStorage.setItem('growtrack_refresh_token', refreshToken);
  },

  clearTokens() {
    localStorage.removeItem('growtrack_token');
    localStorage.removeItem('growtrack_refresh_token');
    localStorage.removeItem('growtrack_user');
  },

  getUser() {
    const raw = localStorage.getItem('growtrack_user');
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    localStorage.setItem('growtrack_user', JSON.stringify(user));
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(this.baseURL + path, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retryRes = await fetch(this.baseURL + path, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${this.getToken()}` },
        });
        return retryRes.json();
      }
      this.clearTokens();
      window.location.hash = '#/login';
      return null;
    }

    return res.json();
  },

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(this.baseURL + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
        if (data.user) this.setUser(data.user);
        return true;
      }
    } catch (e) {}
    return false;
  },

  // Auth API
  async register(email, password, nickname) {
    const res = await fetch(this.baseURL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    });
    const data = await res.json();
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken);
      this.setUser(data.user);
    }
    return data;
  },

  async login(email, password) {
    const res = await fetch(this.baseURL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken);
      this.setUser(data.user);
    }
    return data;
  },

  async logout() {
    const refreshToken = this.getRefreshToken();
    await fetch(this.baseURL + '/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    this.clearTokens();
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Categories API
  async getCategories() {
    return this.request('/categories');
  },

  async createCategory(data) {
    return this.request('/categories', { method: 'POST', body: JSON.stringify(data) });
  },

  // Time Entries API
  async getTimeEntries(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('/time-entries' + (qs ? '?' + qs : ''));
  },

  async getTimeSummary(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('/time-entries/summary' + (qs ? '?' + qs : ''));
  },

  async createTimeEntry(data) {
    return this.request('/time-entries', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateTimeEntry(id, data) {
    return this.request('/time-entries/' + id, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteTimeEntry(id) {
    return this.request('/time-entries/' + id, { method: 'DELETE' });
  },

  // Goals API
  async getGoals(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('/goals' + (qs ? '?' + qs : ''));
  },

  async createGoal(data) {
    return this.request('/goals', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateGoal(id, data) {
    return this.request('/goals/' + id, { method: 'PATCH', body: JSON.stringify(data) });
  },

  async deleteGoal(id) {
    return this.request('/goals/' + id, { method: 'DELETE' });
  },

  // Habits API
  async getHabits() {
    return this.request('/habits');
  },

  async createHabit(data) {
    return this.request('/habits', { method: 'POST', body: JSON.stringify(data) });
  },

  async checkHabit(id) {
    return this.request('/habits/' + id + '/check', { method: 'POST' });
  },

  async uncheckHabit(id) {
    return this.request('/habits/' + id + '/check', { method: 'DELETE' });
  },
};
