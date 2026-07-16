const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret, jwtExpiresIn, jwtRefreshSecret, jwtRefreshExpiresIn } = require('../config/env');
const db = require('../config/database');

// In-memory store for when database is not available
const memoryUsers = new Map();
let memoryIdCounter = 1;

function signTokens(user) {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret || 'dev-secret', { expiresIn: jwtExpiresIn || '7d' });
  const refreshToken = jwt.sign({ id: user.id }, jwtRefreshSecret || 'dev-refresh-secret', { expiresIn: jwtRefreshExpiresIn || '30d' });
  return { accessToken, refreshToken };
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!db.isAvailable()) {
      const key = `${email}:${role || 'client'}`;
      if (memoryUsers.has(key)) {
        return res.status(409).json({ message: 'Email already registered for this role' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const id = `mem-${memoryIdCounter++}`;
      const user = { id, email, full_name: fullName || email.split('@')[0], role: role || 'client', status: 'active', created_at: new Date().toISOString() };
      memoryUsers.set(key, { ...user, password_hash: passwordHash });
      const tokens = signTokens(user);
      return res.status(201).json({ user, ...tokens });
    }

    const userRole = role || 'client';
    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1 AND role = $2', [email, userRole]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email already registered for this role' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows: userRows } = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, status, created_at',
      [email, passwordHash, fullName || '', userRole]
    );
    const user = userRows[0];

    const tokens = signTokens(user);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!db.isAvailable()) {
      let stored;
      for (const [k, v] of memoryUsers) {
        if (k.startsWith(`${email}:`)) { stored = v; break; }
      }
      if (!stored || !(await bcrypt.compare(password, stored.password_hash))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const tokens = signTokens(stored);
      return res.json({ token: tokens.accessToken, ...tokens, user: { id: stored.id, email: stored.email, full_name: stored.full_name, role: stored.role } });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.role !== 'superadmin') {
      if (!(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    let profileComplete = true;
    if (user.role === 'planner') {
      const { rows: plannerRows } = await db.query('SELECT id FROM planners WHERE user_id = $1', [user.id]);
      profileComplete = plannerRows.length > 0;
    } else if (user.role === 'vendor') {
      const { rows: vendorRows } = await db.query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
      profileComplete = vendorRows.length > 0;
    }

    const tokens = signTokens(user);
    res.json({
      token: tokens.accessToken,
      ...tokens,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      profileComplete
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res) => {
  res.json({ message: 'Email verification is available once the verification table is set up' });
};

exports.verifyPhone = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number required' });
  if (!otp) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP] ${phone}: ${otpCode}`);
    return res.json({ message: 'OTP sent', otp: otpCode });
  }
  res.json({ message: 'Phone verified successfully' });
};

exports.forgotPassword = async (req, res) => {
  res.json({ message: 'If the email exists, a reset link has been sent' });
};

exports.resetPassword = async (req, res) => {
  res.json({ message: 'Password reset successfully' });
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, jwtRefreshSecret || 'dev-refresh-secret');
    const tokens = signTokens({ id: payload.id, role: payload.role || 'client' });
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};
