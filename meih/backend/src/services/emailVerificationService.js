const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/database');

const TOKEN_EXPIRY_HOURS = 24;
const CODE_LENGTH = 6;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateOTP() {
  let otp = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

async function sendVerificationEmail(to, token, fullName) {
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/pages/verify-email.html?token=${token}`;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:24px;">MEIH — Email Verification</h1>
      </div>
      <div style="background:#f8f9fa;padding:30px;border:1px solid #e0e0e0;">
        <p style="font-size:16px;color:#333;">Hello <strong>${fullName || 'there'}</strong>,</p>
        <p style="font-size:14px;color:#555;">Thank you for registering with MOFATE Event & Innovation Hub. Please verify your email address by clicking the button below:</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${verifyUrl}" style="background:#1a1a2e;color:#fff;padding:14px 40px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">Verify My Email</a>
        </div>
        <p style="font-size:13px;color:#777;">Or copy and paste this link into your browser:</p>
        <p style="font-size:12px;color:#0066cc;word-break:break-all;">${verifyUrl}</p>
        <p style="font-size:13px;color:#999;margin-top:20px;">This link expires in ${TOKEN_EXPIRY_HOURS} hours. If you did not create an account, please ignore this email.</p>
      </div>
      <div style="background:#1a1a2e;color:#aaa;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:12px;">
        <p style="margin:0;">MOFATE Event & Innovation Hub &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;

  const transport = getTransporter();
  if (!transport) {
    console.log(`[EMAIL-VERIFY] No SMTP configured. Verification URL for ${to}: ${verifyUrl}`);
    return { sent: false, reason: 'no_smtp', verifyUrl };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@meih.co.tz',
    to,
    subject: 'Verify your email — MEIH',
    html,
  });
  return { sent: true };
}

async function createVerification(userId, email, fullName) {
  const token = generateToken();
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  if (!db.isAvailable()) {
    return { token, otp, expiresAt };
  }

  await db.query(
    `INSERT INTO email_verifications (user_id, email, token, otp, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       token = EXCLUDED.token, otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at, verified = false`,
    [userId, email, token, otp, expiresAt.toISOString()]
  );

  const emailResult = await sendVerificationEmail(email, token, fullName);
  return { token, otp, expiresAt, ...emailResult };
}

async function verifyByToken(token) {
  if (!db.isAvailable()) {
    return { verified: true, userId: 'mem-1' };
  }

  const { rows } = await db.query(
    `SELECT * FROM email_verifications WHERE token = $1 AND verified = false`,
    [token]
  );

  if (rows.length === 0) {
    return { verified: false, error: 'Invalid or expired verification token' };
  }

  const record = rows[0];
  if (new Date(record.expires_at) < new Date()) {
    return { verified: false, error: 'Verification token has expired' };
  }

  await db.query(
    `UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1`,
    [record.user_id]
  );
  await db.query(
    `UPDATE email_verifications SET verified = true WHERE user_id = $1`,
    [record.user_id]
  );

  return { verified: true, userId: record.user_id };
}

async function verifyByOTP(userId, otp) {
  if (!db.isAvailable()) {
    return { verified: true };
  }

  const { rows } = await db.query(
    `SELECT * FROM email_verifications WHERE user_id = $1 AND otp = $2 AND verified = false`,
    [userId, otp]
  );

  if (rows.length === 0) {
    return { verified: false, error: 'Invalid OTP' };
  }

  const record = rows[0];
  if (new Date(record.expires_at) < new Date()) {
    return { verified: false, error: 'OTP has expired' };
  }

  await db.query(
    `UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1`,
    [userId]
  );
  await db.query(
    `UPDATE email_verifications SET verified = true WHERE user_id = $1`,
    [userId]
  );

  return { verified: true };
}

async function resendVerification(email) {
  if (!db.isAvailable()) {
    return { sent: false, reason: 'no_db' };
  }

  const { rows: users } = await db.query(
    `SELECT id, full_name FROM users WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email]
  );

  if (users.length === 0) {
    return { sent: false, error: 'No account found with this email' };
  }

  const user = users[0];
  const { rows: existing } = await db.query(
    `SELECT verified FROM email_verifications WHERE user_id = $1`,
    [user.id]
  );

  if (existing.length > 0 && existing[0].verified) {
    return { sent: false, error: 'Email is already verified' };
  }

  return createVerification(user.id, email, user.full_name);
}

module.exports = {
  createVerification,
  verifyByToken,
  verifyByOTP,
  resendVerification,
  generateToken,
  generateOTP,
};
