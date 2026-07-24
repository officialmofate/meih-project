const db = require('../config/database');

exports.create = async (userId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO payments (booking_id, user_id, method, amount, currency, status, payment_number, payment_name, screenshot_url, screenshot_base64, notes)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      payload.bookingId || null, userId, payload.method || 'mobile_money',
      payload.amount, payload.currency || 'TZS',
      payload.paymentNumber || null, payload.paymentName || null,
      payload.screenshotUrl || null, payload.screenshotBase64 || null, payload.notes || null
    ]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT p.*, u.full_name AS user_name, u.email AS user_email,
            b.event_id, e.name AS event_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN events e ON e.id = b.event_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0];
};

exports.list = async (userId, { page = 1, limit = 50, bookingId } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['p.user_id = $3'];
  const params = [limit, offset, userId];
  let idx = 4;

  if (bookingId) {
    conditions.push(`p.booking_id = $${idx++}`);
    params.push(bookingId);
  }

  const where = conditions.join(' AND ');
  const { rows } = await db.query(
    `SELECT p.*, e.name AS event_name
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN events e ON e.id = b.event_id
     WHERE ${where}
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );
  return rows;
};

exports.listAll = async ({ page = 1, limit = 50, status } = {}) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT p.*, u.full_name AS user_name, e.name AS event_name
    FROM payments p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN bookings b ON b.id = p.booking_id
    LEFT JOIN events e ON e.id = b.event_id`;
  const params = [];
  let idx = 1;

  if (status) {
    query += ` WHERE p.status = $${idx++}`;
    params.push(status);
  }

  query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  params.push(limit, offset);

  const { rows } = await db.query(query, params);
  return rows;
};

exports.listForPlanner = async (plannerUserId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT p.*, u.full_name AS payer_name, e.name AS event_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN planners pl ON pl.id = b.planner_id
     WHERE pl.user_id = $3
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, plannerUserId]
  );
  return rows;
};

exports.confirm = async (id, confirmedBy) => {
  const { rows } = await db.query(
    `UPDATE payments SET status = 'completed', confirmed_by = $2, confirmed_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id, confirmedBy]
  );
  return rows[0];
};

exports.reject = async (id) => {
  const { rows } = await db.query(
    `UPDATE payments SET status = 'failed'
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id]
  );
  return rows[0];
};

exports.handleCallback = async (id, payload) => {
  const { rows } = await db.query(
    `UPDATE payments SET status = $2, reference = COALESCE($3, reference)
     WHERE id = $1 RETURNING *`,
    [id, payload.status, payload.reference]
  );
  return rows[0];
};

exports.listInvoices = async (userId) => {
  const { rows } = await db.query(
    `SELECT p.*, e.name AS event_name, b.deposit_amount
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN events e ON e.id = b.event_id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return rows;
};

exports.getInvoice = async (id) => {
  const { rows } = await db.query(
    `SELECT p.*, u.full_name AS user_name, u.email AS user_email,
            e.name AS event_name, e.location AS event_location, e.event_date,
            b.deposit_amount, v.business_name AS vendor_name, v.payment_number AS vendor_payment_number,
            v.payment_name AS vendor_payment_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN vendors v ON v.id = b.vendor_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0];
};

exports.getPaymentDetails = async (bookingId) => {
  const { rows } = await db.query(
    `SELECT
       COALESCE(v.payment_number, pl.payment_number) AS payment_number,
       COALESCE(v.payment_name, pl.payment_name) AS payment_name,
       COALESCE(v.payment_method, pl.payment_method, 'mobile_money') AS payment_method,
       COALESCE(v.business_name, pl.company_name) AS payee_name
     FROM bookings b
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners pl ON pl.id = b.planner_id
     WHERE b.id = $1`,
    [bookingId]
  );
  return rows[0];
};

exports.updateScreenshot = async (id, userId, screenshotUrl, screenshotBase64) => {
  const { rows } = await db.query(
    `UPDATE payments SET screenshot_url = $3, screenshot_base64 = $4, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, screenshotUrl, screenshotBase64 || null]
  );
  return rows[0];
};
