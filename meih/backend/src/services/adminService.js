const db = require('../config/database');

exports.getDashboard = async () => {
  const [users, events, submissions, payments] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS count FROM users'),
    db.query('SELECT COUNT(*)::int AS count FROM events'),
    db.query('SELECT COUNT(*)::int AS count FROM innovation_submissions'),
    db.query("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE status = 'completed'"),
  ]);
  return {
    totalUsers: users.rows[0].count,
    totalEvents: events.rows[0].count,
    totalSubmissions: submissions.rows[0].count,
    totalRevenue: Number(payments.rows[0].total),
  };
};

exports.getAnalytics = async () => {
  const [newUsers, newEvents, newSubmissions, recentPayments] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS count FROM users WHERE created_at >= now() - interval '30 days'"),
    db.query("SELECT COUNT(*)::int AS count FROM events WHERE created_at >= now() - interval '30 days'"),
    db.query("SELECT COUNT(*)::int AS count FROM innovation_submissions WHERE created_at >= now() - interval '30 days'"),
    db.query("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE status = 'completed' AND created_at >= now() - interval '30 days'"),
  ]);
  return {
    monthlyNewUsers: newUsers.rows[0].count,
    monthlyNewEvents: newEvents.rows[0].count,
    monthlyNewSubmissions: newSubmissions.rows[0].count,
    monthlyRevenue: Number(recentPayments.rows[0].total),
  };
};

exports.listUsers = async ({ page = 1, limit = 50, role, search, status } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (role) {
    conditions.push(`role = $${idx++}`);
    params.push(role);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT id, email, full_name, role, status, created_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );
  return rows;
};

exports.updateUserRole = async (id, role) => {
  const { rows } = await db.query(
    'UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING id, email, full_name, role, status',
    [id, role]
  );
  return rows[0];
};

exports.updateUserStatus = async (id, status) => {
  const { rows } = await db.query(
    'UPDATE users SET status = $2, updated_at = now() WHERE id = $1 RETURNING id, email, full_name, role, status',
    [id, status]
  );
  return rows[0];
};

exports.listAllEvents = async ({ page = 1, limit = 50, confirmationStatus } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (confirmationStatus) {
    conditions.push(`e.confirmation_status = $${idx++}`);
    params.push(confirmationStatus);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT e.*, c.name AS category_name, u.full_name AS client_name
     FROM events e
     LEFT JOIN event_categories c ON c.id = e.category_id
     LEFT JOIN users u ON u.id = e.client_id
     ${where}
     ORDER BY e.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );
  return rows;
};

exports.listAllPayments = async ({ page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT p.*, u.full_name AS user_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

exports.listPendingConfirmations = async ({ page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(
      `SELECT e.*, c.name AS category_name, u.full_name AS planner_name,
              u.email AS planner_email
       FROM events e
       LEFT JOIN event_categories c ON c.id = e.category_id
       LEFT JOIN users u ON u.id = e.client_id
       WHERE e.confirmation_status = 'pending'
       ORDER BY e.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  } catch (err) {
    if (err.message && err.message.includes('confirmation_status')) {
      return [];
    }
    throw err;
  }
};

exports.getPendingApprovals = async () => {
  const [vendors, submissions, events] = await Promise.all([
    db.query(`SELECT v.*, u.full_name FROM vendors v LEFT JOIN users u ON u.id = v.user_id WHERE v.verified = false ORDER BY v.created_at DESC LIMIT 20`),
    db.query(`SELECT s.*, u.full_name FROM innovation_submissions s LEFT JOIN users u ON u.id = s.user_id WHERE s.status = 'pending_review' ORDER BY s.created_at DESC LIMIT 20`),
    db.query(`SELECT e.*, u.full_name FROM events e LEFT JOIN users u ON u.id = e.client_id WHERE e.status = 'draft' ORDER BY e.created_at DESC LIMIT 20`),
  ]);
  return {
    vendors: vendors.rows,
    submissions: submissions.rows,
    events: events.rows,
  };
};
