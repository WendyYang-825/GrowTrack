-- GrowTrack RLS (Row Level Security) 策略
-- 确保用户只能访问自己的数据

-- 启用 RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- time_entries 策略
CREATE POLICY "users can read own time_entries" ON time_entries
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own time_entries" ON time_entries
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can update own time_entries" ON time_entries
  FOR UPDATE USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can delete own time_entries" ON time_entries
  FOR DELETE USING (current_setting('app.user_id', true) = user_id);

-- categories 策略
CREATE POLICY "users can read own categories" ON categories
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own categories" ON categories
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can update own categories" ON categories
  FOR UPDATE USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can delete own categories" ON categories
  FOR DELETE USING (current_setting('app.user_id', true) = user_id);

-- goals 策略
CREATE POLICY "users can read own goals" ON goals
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own goals" ON goals
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can update own goals" ON goals
  FOR UPDATE USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can delete own goals" ON goals
  FOR DELETE USING (current_setting('app.user_id', true) = user_id);

-- habits 策略
CREATE POLICY "users can read own habits" ON habits
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own habits" ON habits
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can update own habits" ON habits
  FOR UPDATE USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can delete own habits" ON habits
  FOR DELETE USING (current_setting('app.user_id', true) = user_id);

-- habit_logs 策略
CREATE POLICY "users can read own habit_logs" ON habit_logs
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own habit_logs" ON habit_logs
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can update own habit_logs" ON habit_logs
  FOR UPDATE USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can delete own habit_logs" ON habit_logs
  FOR DELETE USING (current_setting('app.user_id', true) = user_id);

-- daily_stats 策略
CREATE POLICY "users can read own daily_stats" ON daily_stats
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own daily_stats" ON daily_stats
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

-- user_settings 策略
CREATE POLICY "users can read own settings" ON user_settings
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can update own settings" ON user_settings
  FOR UPDATE USING (current_setting('app.user_id', true) = user_id);

-- refresh_tokens 策略
CREATE POLICY "users can read own refresh_tokens" ON refresh_tokens
  FOR SELECT USING (current_setting('app.user_id', true) = user_id);

CREATE POLICY "users can delete own refresh_tokens" ON refresh_tokens
  FOR DELETE USING (current_setting('app.user_id', true) = user_id);
