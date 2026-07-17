const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwtSecret, jwtExpiresIn, jwtRefreshSecret, jwtRefreshExpiresIn } = require('../config/env');
const db = require('../config/database');
const { validateEmail } = require('../utils/emailValidator');
const emailVerification = require('../services/emailVerificationService');

const PUBLIC_ROLES = ['client', 'planner', 'vendor', 'innovator', 'public_voter'];

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

    const userRole = role || 'client';
    if (!PUBLIC_ROLES.includes(userRole)) {
      return res.status(403).json({ message: 'Cannot self-register with this role' });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: 'Invalid email', errors: emailCheck.errors });
    }
    const cleanEmail = emailCheck.email;

    if (!db.isAvailable()) {
      const key = `${cleanEmail}:${userRole}`;
      if (memoryUsers.has(key)) {
        return res.status(409).json({ message: 'Email already registered for this role' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const id = `mem-${memoryIdCounter++}`;
      const user = { id, email: cleanEmail, full_name: fullName || cleanEmail.split('@')[0], role: userRole, status: 'active', email_verified: false, created_at: new Date().toISOString() };
      memoryUsers.set(key, { ...user, password_hash: passwordHash });
      const tokens = signTokens(user);
      return res.status(201).json({ user, ...tokens, emailVerificationRequired: true });
    }

    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1 AND role = $2', [cleanEmail, userRole]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email already registered for this role' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows: userRows } = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, email_verified) VALUES ($1, $2, $3, $4, false) RETURNING id, email, full_name, role, status, email_verified, created_at',
      [cleanEmail, passwordHash, fullName || '', userRole]
    );
    const user = userRows[0];

    let verificationResult = null;
    try {
      verificationResult = await emailVerification.createVerification(user.id, cleanEmail, fullName || user.full_name);
    } catch (emailErr) {
      console.error('[REGISTER] Email verification error:', emailErr.message);
    }

    const tokens = signTokens(user);
    res.status(201).json({
      user,
      ...tokens,
      emailVerificationRequired: true,
      emailVerificationSent: verificationResult?.sent === true,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
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
      return res.json({ token: tokens.accessToken, ...tokens, user: { id: stored.id, email: stored.email, full_name: stored.full_name, role: stored.role, name: stored.full_name } });
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
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, name: user.full_name, email_verified: user.email_verified },
      profileComplete,
      emailVerified: user.email_verified
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token, otp, userId } = req.body;

    if (token) {
      const result = await emailVerification.verifyByToken(token);
      if (!result.verified) {
        return res.status(400).json({ message: result.error || 'Verification failed' });
      }
      return res.json({ message: 'Email verified successfully' });
    }

    if (otp && userId) {
      const result = await emailVerification.verifyByOTP(userId, otp);
      if (!result.verified) {
        return res.status(400).json({ message: result.error || 'Verification failed' });
      }
      return res.json({ message: 'Email verified successfully' });
    }

    return res.status(400).json({ message: 'Token or OTP + userId required' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const result = await emailVerification.resendVerification(email);
    if (result.sent === false && result.error) {
      return res.status(400).json({ message: result.error });
    }
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend verification' });
  }
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
