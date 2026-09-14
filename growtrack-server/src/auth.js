const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

// 密码哈希
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// 验证密码
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// 生成 Access Token（短期，15分钟）
function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

// 生成 Refresh Token（长期，7天）
function generateRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
}

// 验证 Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// 哈希 Refresh Token（存入数据库时使用）
async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES,
};
