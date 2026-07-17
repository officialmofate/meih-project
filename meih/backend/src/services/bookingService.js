const db = require('../config/database');

exports.create = async (clientId, payload) => {
  if (!payload.eventId) {
    throw Object.assign(new Error('Event ID is required'), { status: 400 });
  }

  const { rows: events } = await db.query(
    `SELECT id, client_id, status, confirmation_status FROM events WHERE id = $1`,
    [payload.eventId]
  );
  if (!events[0]) {
    throw Object.assign(new Error('Event not found'), { status: 404 });
  }
  if (events[0].client_id === clientId) {
    throw Object.assign(new Error('You cannot book your own event'), { status: 400 });
  }
  const ev = events[0];
  if (ev.status !== 'published' || ev.confirmation_status !== 'confirmed') {
    throw Object.assign(new Error('Event is not available for booking'), { status: 400 });
  }

  const { rows } = await db.query(
    `INSERT INTO bookings (client_id, event_id, vendor_id, planner_id, deposit_amount, client_name, client_phone, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [clientId, payload.eventId, payload.vendorId || null, payload.plannerId || null,
     payload.depositAmount || 0, payload.clientName || null, payload.clientPhone || null]
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
    query = `SELECT b.*, e.name AS event_name, e.event_date, e.guest_count, e.location AS event_location, u.full_name AS client_name
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

exports.confirm = async (id, userId, role) => {
  if (role === 'planner') {
    const { rows } = await db.query(
      `UPDATE bookings SET status = 'confirmed', updated_at = now()
       WHERE id = $1 AND status = 'pending'
       AND planner_id IN (SELECT id FROM planners WHERE user_id = $2)
       RETURNING *`,
      [id, userId]
    );
    return rows[0];
  }
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

exports.setDeposit = async (id, plannerUserId, amount) => {
  const { rows } = await db.query(
    `UPDATE bookings SET deposit_amount = $3, updated_at = now()
     WHERE id = $1 AND planner_id IN (SELECT id FROM planners WHERE user_id = $2)
     RETURNING *`,
    [id, plannerUserId, amount]
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

exports.getTicketData = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location,
            e.event_date, e.category_id, e.budget, e.guest_count,
            v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name, u.email AS client_email
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
