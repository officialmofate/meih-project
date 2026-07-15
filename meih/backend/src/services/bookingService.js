const db = require('../config/database');

exports.create = async (clientId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO bookings (client_id, event_id, vendor_id, planner_id, deposit_amount, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [clientId, payload.eventId, payload.vendorId || null, payload.plannerId || null, payload.depositAmount || 0]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location,
            v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     LEFT JOIN users u ON u.id = b.client_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};

exports.list = async (userId, role, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  let query;
  const params = [limit, offset];

  if (role === 'admin') {
    query = `SELECT b.*, e.name AS event_name, v.business_name AS vendor_name,
                    p.company_name AS planner_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN vendors v ON v.id = b.vendor_id
             LEFT JOIN planners p ON p.id = b.planner_id
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
  } else if (role === 'vendor') {
    query = `SELECT b.*, e.name AS event_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN vendors v ON v.id = b.vendor_id
             WHERE v.user_id = $3
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
    params.splice(2, 0, userId);
  } else if (role === 'planner') {
    query = `SELECT b.*, e.name AS event_name, u.full_name AS client_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN planners p ON p.id = b.planner_id
             LEFT JOIN users u ON u.id = b.client_id
             WHERE p.user_id = $3
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
    params.splice(2, 0, userId);
  } else {
    query = `SELECT b.*, e.name AS event_name, v.business_name AS vendor_name,
                    p.company_name AS planner_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN vendors v ON v.id = b.vendor_id
             LEFT JOIN planners p ON p.id = b.planner_id
             WHERE b.client_id = $3
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
    params.splice(2, 0, userId);
  }

  const { rows } = await db.query(query, params);
  return rows;
};

exports.update = async (id, userId, payload) => {
  const { rows } = await db.query(
    `UPDATE bookings SET
       deposit_amount = COALESCE($3, deposit_amount),
       updated_at = now()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [id, userId, payload.depositAmount]
  );
  return rows[0];
};

exports.confirm = async (id) => {
  const { rows } = await db.query(
    `UPDATE bookings SET status = 'confirmed', updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id]
  );
  return rows[0];
};

exports.cancel = async (id) => {
  const { rows } = await db.query(
    `UPDATE bookings SET status = 'cancelled', updated_at = now()
     WHERE id = $1 AND status IN ('pending', 'confirmed')
     RETURNING *`,
    [id]
  );
  return rows[0];
};

exports.getInvoice = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location, e.event_date,
            v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name, u.email AS client_email,
            pay.amount AS payment_amount, pay.method AS payment_method,
            pay.status AS payment_status, pay.reference AS payment_reference
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     LEFT JOIN users u ON u.id = b.client_id
     LEFT JOIN payments pay ON pay.booking_id = b.id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};
