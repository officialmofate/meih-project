const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const db = require('../config/database');

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

// Per-user rate limiting for sensitive operations
const sensitiveOpCounts = new Map();
const SENSITIVE_OP_WINDOW_MS = 60 * 1000; // 1 minute
const SENSITIVE_OP_MAX = 10;

function trackSensitiveOp(userId) {
  const now = Date.now();
  const record = sensitiveOpCounts.get(userId);
  if (!record || now - record.windowStart > SENSITIVE_OP_WINDOW_MS) {
    sensitiveOpCounts.set(userId, { windowStart: now, count: 1 });
    return { limited: false, remaining: SENSITIVE_OP_MAX - 1 };
  }
  record.count++;
  if (record.count > SENSITIVE_OP_MAX) {
    return { limited: true, remaining: 0 };
  }
  return { limited: false, remaining: SENSITIVE_OP_MAX - record.count };
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret || 'dev-secret');

    // Token expiration check with buffer
    if (payload.exp) {
      const nowSecs = Math.floor(Date.now() / 1000);
      if (payload.exp - nowSecs < TOKEN_EXPIRY_BUFFER_SECONDS) {
        return res.status(401).json({ message: 'Token is about to expire, please refresh' });
      }
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    // superadmin has access to everything
    if (req.user.role === 'superadmin') {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

async function checkUserStatus(req, res, next) {
  // Skip status check for superadmin
  if (!req.user || req.user.role === 'superadmin') {
    return next();
  }

  if (!db.isAvailable()) {
    return next();
  }

  try {
    const { rows } = await db.query('SELECT status FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (rows[0].status === 'suspended') {
      return res.status(403).json({ message: 'Account has been suspended' });
    }
    next();
  } catch (err) {
    // Don't block requests if status check fails
    next();
  }
}

function sensitiveOpRateLimit(req, res, next) {
  if (!req.user) {
    return next();
  }
  const result = trackSensitiveOp(req.user.id);
  if (result.limited) {
    return res.status(429).json({ message: 'Too many requests, please slow down', code: 'RATE_LIMITED' });
  }
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  next();
}

module.exports = { authenticate, authorize, checkUserStatus, sensitiveOpRateLimit };
