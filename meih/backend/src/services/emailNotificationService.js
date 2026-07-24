const nodemailer = require('nodemailer');
const db = require('../config/database');

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

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const BASE_URL = process.env.APP_URL || process.env.FRONTEND_URL || 'https://meih.onrender.com';

function emailWrapper(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#1a1a2e;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:20px;">MEIH — Event & Innovation Hub</h1>
      </div>
      <div style="background:#f8f9fa;padding:30px;border:1px solid #e0e0e0;">
        <h2 style="color:#1a1a2e;margin-top:0;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="background:#1a1a2e;color:#aaa;padding:15px;text-align:center;border-radius:0 0 8px 8px;font-size:12px;">
        <p style="margin:0;">MOFATE Event & Innovation Hub &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>`;
}

async function sendEmail(to, subject, html) {
  if (!isConfigured()) {
    console.log(`[EMAIL-NOTIF] No SMTP configured. Would send to ${to}: ${subject}`);
    return { sent: false, reason: 'no_smtp' };
  }
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@meih.co.tz',
      to,
      subject,
      html,
    });
    console.log(`[EMAIL-NOTIF] Sent "${subject}" to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL-NOTIF] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

async function createInAppNotification(userId, title, body) {
  try {
    if (!db.isAvailable()) return;
    await db.query(
      `INSERT INTO notifications (user_id, channel, title, body) VALUES ($1, 'in_app', $2, $3)`,
      [userId, title, body]
    );
  } catch (err) {
    console.error('[EMAIL-NOTIF] Failed to create in-app notification:', err.message);
  }
}

async function getUserEmail(userId) {
  if (!userId || !db.isAvailable()) return null;
  try {
    const { rows } = await db.query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
    return rows[0] || null;
  } catch { return null; }
}

// --- Notification functions for each system step ---

exports.onRegistration = async (userId, email, fullName) => {
  const html = emailWrapper('Welcome to MEIH!', `
    <p style="color:#555;">Hello <strong>${fullName || 'there'}</strong>,</p>
    <p style="color:#555;">Thank you for registering with MOFATE Event & Innovation Hub. Your account has been created successfully.</p>
    <p style="color:#555;">Please verify your email address to get started. You can log in at:</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/login.html" style="background:#1a1a2e;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">Log In</a>
    </div>
  `);
  await createInAppNotification(userId, 'Account Created', 'Your account has been created. Please verify your email.');
  return sendEmail(email, 'Welcome to MEIH — Account Created', html);
};

exports.onSubmissionCreated = async (userId, submissionTitle, competitionTitle) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Innovation Submitted', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your innovation <strong>"${submissionTitle}"</strong> has been successfully submitted to the <strong>${competitionTitle || 'competition'}</strong>.</p>
    <p style="color:#555;">Status: <strong>Pending Review</strong></p>
    <p style="color:#555;">Our team will review your submission shortly. You can track your progress in the dashboard.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/dashboard-innovator.html" style="background:#6c5ce7;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">View Dashboard</a>
    </div>
  `);
  await createInAppNotification(userId, 'Innovation Submitted', `Your innovation "${submissionTitle}" has been submitted for review.`);
  return sendEmail(user.email, `Innovation Submitted — ${submissionTitle}`, html);
};

exports.onSubmissionApproved = async (userId, submissionTitle) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Innovation Approved!', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Great news! Your innovation <strong>"${submissionTitle}"</strong> has been <strong style="color:#00b894;">approved</strong>.</p>
    <p style="color:#555;">Next steps: Complete your payment, then your innovation will be reviewed and scored by our expert reviewers and judges.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/dashboard-innovator.html" style="background:#00b894;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">View Dashboard</a>
    </div>
  `);
  await createInAppNotification(userId, 'Innovation Approved', `Your innovation "${submissionTitle}" has been approved!`);
  return sendEmail(user.email, `Innovation Approved — ${submissionTitle}`, html);
};

exports.onSubmissionRejected = async (userId, submissionTitle) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Innovation Not Approved', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your innovation <strong>"${submissionTitle}"</strong> was not approved at this time.</p>
    <p style="color:#555;">Please review the feedback in your dashboard and consider resubmitting.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/dashboard-innovator.html" style="background:#1a1a2e;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">View Dashboard</a>
    </div>
  `);
  await createInAppNotification(userId, 'Innovation Not Approved', `Your innovation "${submissionTitle}" was not approved.`);
  return sendEmail(user.email, `Innovation Not Approved — ${submissionTitle}`, html);
};

exports.onPaymentConfirmed = async (userId, submissionTitle) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Payment Confirmed', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your payment for innovation <strong>"${submissionTitle}"</strong> has been confirmed.</p>
    <p style="color:#555;">Your innovation will now proceed to reviewer evaluation and judge scoring.</p>
  `);
  await createInAppNotification(userId, 'Payment Confirmed', `Your payment for "${submissionTitle}" has been confirmed.`);
  return sendEmail(user.email, `Payment Confirmed — ${submissionTitle}`, html);
};

exports.onPaymentRejected = async (userId, submissionTitle) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Payment Not Verified', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your payment for innovation <strong>"${submissionTitle}"</strong> could not be verified.</p>
    <p style="color:#555;">Please check the details and resubmit your payment.</p>
  `);
  await createInAppNotification(userId, 'Payment Not Verified', `Your payment for "${submissionTitle}" could not be verified.`);
  return sendEmail(user.email, `Payment Not Verified — ${submissionTitle}`, html);
};

exports.onReviewerAssigned = async (reviewerId, submissionTitle) => {
  const user = await getUserEmail(reviewerId);
  if (!user) return;
  const html = emailWrapper('Review Assignment', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">You have been assigned to review innovation <strong>"${submissionTitle}"</strong>.</p>
    <p style="color:#555;">Please complete your review in the reviewer dashboard.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/dashboard-reviewer.html" style="background:#6c5ce7;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">Review Now</a>
    </div>
  `);
  await createInAppNotification(reviewerId, 'Review Assignment', `You have been assigned to review "${submissionTitle}".`);
  return sendEmail(user.email, `Review Assignment — ${submissionTitle}`, html);
};

exports.onReviewerScoreSubmitted = async (innovatorId, submissionTitle) => {
  const user = await getUserEmail(innovatorId);
  if (!user) return;
  const html = emailWrapper('Reviewer Evaluation Complete', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your innovation <strong>"${submissionTitle}"</strong> has been evaluated by a reviewer.</p>
    <p style="color:#555;">Next: A judge will now score your innovation.</p>
  `);
  await createInAppNotification(innovatorId, 'Reviewer Evaluation Complete', `Your innovation "${submissionTitle}" has been reviewed.`);
  return sendEmail(user.email, `Reviewer Evaluation Complete — ${submissionTitle}`, html);
};

exports.onJudgeAssigned = async (judgeId, submissionTitle) => {
  const user = await getUserEmail(judgeId);
  if (!user) return;
  const html = emailWrapper('Judge Assignment', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">You have been assigned to judge innovation <strong>"${submissionTitle}"</strong>.</p>
    <p style="color:#555;">Please complete your scoring in the judge dashboard.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/dashboard-judge.html" style="background:#6c5ce7;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">Score Now</a>
    </div>
  `);
  await createInAppNotification(judgeId, 'Judge Assignment', `You have been assigned to judge "${submissionTitle}".`);
  return sendEmail(user.email, `Judge Assignment — ${submissionTitle}`, html);
};

exports.onJudgeScoreSubmitted = async (innovatorId, submissionTitle) => {
  const user = await getUserEmail(innovatorId);
  if (!user) return;
  const html = emailWrapper('Judge Evaluation Complete', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your innovation <strong>"${submissionTitle}"</strong> has been scored by a judge.</p>
    <p style="color:#555;">Next: Your innovation will now be open for public voting!</p>
  `);
  await createInAppNotification(innovatorId, 'Judge Evaluation Complete', `Your innovation "${submissionTitle}" has been scored by a judge.`);
  return sendEmail(user.email, `Judge Evaluation Complete — ${submissionTitle}`, html);
};

exports.onVotingOpened = async (innovatorId, submissionTitle) => {
  const user = await getUserEmail(innovatorId);
  if (!user) return;
  const html = emailWrapper('Voting Now Open!', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Great news! Your innovation <strong>"${submissionTitle}"</strong> is now open for public voting!</p>
    <p style="color:#555;">Share your innovation with others to get more votes.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/innovation-detail.html?id=${submissionTitle}" style="background:#f9ca24;color:#1a1a2e;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">View Innovation</a>
    </div>
  `);
  await createInAppNotification(innovatorId, 'Voting Now Open', `Your innovation "${submissionTitle}" is now open for public voting!`);
  return sendEmail(user.email, `Voting Now Open — ${submissionTitle}`, html);
};

exports.onVotingClosed = async (innovatorId, submissionTitle) => {
  const user = await getUserEmail(innovatorId);
  if (!user) return;
  const html = emailWrapper('Voting Period Ended', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">The voting period for <strong>"${submissionTitle}"</strong> has ended.</p>
    <p style="color:#555;">Final results will be announced soon. Check the leaderboard for standings.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${BASE_URL}/pages/leaderboard.html" style="background:#1a1a2e;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;">View Leaderboard</a>
    </div>
  `);
  await createInAppNotification(innovatorId, 'Voting Period Ended', `Voting for "${submissionTitle}" has ended.`);
  return sendEmail(user.email, `Voting Period Ended — ${submissionTitle}`, html);
};

exports.onEventBookingConfirmed = async (userId, eventName) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Event Booking Confirmed', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your booking for <strong>"${eventName}"</strong> has been confirmed.</p>
    <p style="color:#555;">Check your dashboard for ticket details and event information.</p>
  `);
  await createInAppNotification(userId, 'Booking Confirmed', `Your booking for "${eventName}" has been confirmed.`);
  return sendEmail(user.email, `Booking Confirmed — ${eventName}`, html);
};

exports.onEventBookingCancelled = async (userId, eventName) => {
  const user = await getUserEmail(userId);
  if (!user) return;
  const html = emailWrapper('Event Booking Cancelled', `
    <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
    <p style="color:#555;">Your booking for <strong>"${eventName}"</strong> has been cancelled.</p>
    <p style="color:#555;">If you have any questions, please contact our support team.</p>
  `);
  await createInAppNotification(userId, 'Booking Cancelled', `Your booking for "${eventName}" has been cancelled.`);
  return sendEmail(user.email, `Booking Cancelled — ${eventName}`, html);
};

exports.onCompetitionVotingClosed = async (competitionTitle) => {
  if (!db.isAvailable()) return;
  try {
    const { rows: innovators } = await db.query(
      `SELECT DISTINCT s.user_id, u.email, u.full_name
       FROM innovation_submissions s
       JOIN users u ON u.id = s.user_id
       WHERE s.competition_id IN (SELECT id FROM innovation_competitions WHERE title = $1)
       AND s.status = 'approved'`,
      [competitionTitle]
    );
    for (const user of innovators) {
      if (!user.email) continue;
      const html = emailWrapper('Competition Voting Closed', `
        <p style="color:#555;">Hello <strong>${user.full_name || 'there'}</strong>,</p>
        <p style="color:#555;">Voting for the <strong>"${competitionTitle}"</strong> competition has closed.</p>
        <p style="color:#555;">Final results will be announced soon.</p>
      `);
      await createInAppNotification(user.user_id, 'Competition Voting Closed', `Voting for "${competitionTitle}" has closed.`);
      sendEmail(user.email, `Competition Voting Closed — ${competitionTitle}`, html);
    }
  } catch (err) {
    console.error('[EMAIL-NOTIF] Error sending competition close notifications:', err.message);
  }
};
