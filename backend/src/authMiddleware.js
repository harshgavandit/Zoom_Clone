// authMiddleware.js - JWT auth, token refresh, RBAC middleware
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod';

// Token blacklist for logout (in production, use Redis)
const tokenBlacklist = new Set();

export function generateAccessToken(userId, username, role = 'user') {
  return jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function revokeToken(token) {
  tokenBlacklist.add(token);
}

export function isTokenRevoked(token) {
  return tokenBlacklist.has(token);
}

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  if (isTokenRevoked(token)) return res.status(401).json({ message: 'Token has been revoked' });

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
};

export const rbacMiddleware = (requiredRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  if (req.user.role !== requiredRole && req.user.role !== 'admin') {
    return res.status(403).json({ message: `Requires ${requiredRole} role` });
  }
  next();
};
