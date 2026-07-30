const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const db = require('../config/database');

const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

// Per-user rate limiting for sensitive operations
const sensitiveOpCounts = new Map();
const SENSITIVE_OP_WINDOW_MS = 60 * 1000; // 1 minute
const SENSITIVE_OP_MAX = 15;

// Cleanup stale entries every 5 minutes
setInterval(function () {
  const cutoff = Date.now() - SENSITIVE_OP_WINDOW_MS * 2;
  for (const [key, record] of sensitiveOpCounts) {
    if (record.windowStart < cutoff) sensitiveOpCounts.delete(key);
  }
}, 5 * 60 * 1000).unref();

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
  let token = null;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret || 'dev-secret');

    // Token expiration check with buffer — skip for query-param tokens (ticket links)
    if (payload.exp && !req.query.token) {
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
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    if (req.user.role === 'superadmin') {
      return next();
    }
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    // JWT role is insufficient — check if role was changed in DB since token was issued
    try {
      const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      if (rows.length) {
        if (rows[0].role === 'superadmin') {
          req.user.role = rows[0].role;
          return next();
        }
        if (allowedRoles.includes(rows[0].role)) {
          req.user.role = rows[0].role;
          return next();
        }
      }
    } catch (e) {
      // DB check failed, fall through to rejection
    }
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
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
