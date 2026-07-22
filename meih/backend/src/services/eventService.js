const db = require('../config/database');

function nullable(val) {
  return val === undefined || val === null || val === '' ? null : val;
}

exports.listCategories = async () => {
  const { rows } = await db.query('SELECT * FROM event_categories ORDER BY name');
  return rows;
};

exports.getCategory = async (id) => {
  const { rows } = await db.query('SELECT * FROM event_categories WHERE id = $1', [id]);
  return rows[0];
};

exports.create = async (clientId, payload) => {
  let categoryId = payload.categoryId;
  if (!categoryId && payload.category) {
    try {
      const { rows } = await db.query('SELECT id FROM event_categories WHERE name = $1', [payload.category]);
      if (rows[0]) categoryId = rows[0].id;
    } catch (e) {
      console.warn('[EVENT] Category lookup failed:', e.message);
    }
  }
  const { rows } = await db.query(
    `INSERT INTO events (client_id, name, category_id, location, latitude, longitude, budget, event_date, guest_count, services, requirements, quote_deadline, ticket_price, num_payments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    [
      clientId, payload.name, nullable(categoryId), nullable(payload.location),
      nullable(payload.latitude), nullable(payload.longitude),
      nullable(payload.budget), nullable(payload.eventDate),
      nullable(payload.guestCount), nullable(payload.services),
      nullable(payload.requirements), nullable(payload.quoteDeadline),
      nullable(payload.ticketPrice), nullable(payload.numPayments) || 1
    ]
  );
  return rows[0];
};

exports.list = async ({ page = 1, limit = 50, category, status, search } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`c.name = $${idx++}`);
    params.push(category);
  }
  if (status) {
    conditions.push(`e.status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(e.name ILIKE $${idx} OR e.location ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT e.*, c.name AS category_name, c.suggested_fee_usd,
            u.full_name AS client_name
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

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT e.*, c.name AS category_name, c.suggested_fee_usd,
            u.full_name AS client_name
     FROM events e
     LEFT JOIN event_categories c ON c.id = e.category_id
     LEFT JOIN users u ON u.id = e.client_id
     WHERE e.id = $1`,
    [id]
  );
  return rows[0];
};

exports.update = async (id, clientId, payload) => {
  let categoryId = payload.categoryId;
  if (!categoryId && payload.category) {
    const { rows } = await db.query('SELECT id FROM event_categories WHERE name = $1', [payload.category]);
    if (rows[0]) categoryId = rows[0].id;
  }
  const { rows } = await db.query(
    `UPDATE events SET
       name = COALESCE($3, name),
       category_id = COALESCE($4, category_id),
       location = COALESCE($5, location),
       latitude = COALESCE($6, latitude),
       longitude = COALESCE($7, longitude),
       budget = COALESCE($8, budget),
       event_date = COALESCE($9, event_date),
       guest_count = COALESCE($10, guest_count),
       services = COALESCE($11, services),
       requirements = COALESCE($12, requirements),
       quote_deadline = COALESCE($13, quote_deadline),
       ticket_price = COALESCE($14, ticket_price),
       num_payments = COALESCE($15, num_payments),
       updated_at = now()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [id, clientId, payload.name, nullable(categoryId), nullable(payload.location),
     nullable(payload.latitude), nullable(payload.longitude),
     nullable(payload.budget), nullable(payload.eventDate),
     nullable(payload.guestCount), nullable(payload.services),
     nullable(payload.requirements), nullable(payload.quoteDeadline),
     nullable(payload.ticketPrice), nullable(payload.numPayments)]
  );
  return rows[0];
};

exports.remove = async (id, clientId) => {
  const { rowCount } = await db.query(
    'DELETE FROM events WHERE id = $1 AND client_id = $2',
    [id, clientId]
  );
  return rowCount > 0;
};

exports.publish = async (id, clientId) => {
  const { rows } = await db.query(
    `UPDATE events SET status = 'published', updated_at = now()
     WHERE id = $1 AND client_id = $2 AND status = 'draft'
     RETURNING *`,
    [id, clientId]
  );
  return rows[0];
};

exports.updateStatus = async (id, status) => {
  const { rows } = await db.query(
    `UPDATE events SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0];
};

exports.listEventBookings = async (eventId) => {
  const { rows } = await db.query(
    `SELECT b.*, v.business_name AS vendor_name, p.company_name AS planner_name
     FROM bookings b
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     WHERE b.event_id = $1
     ORDER BY b.created_at DESC`,
    [eventId]
  );
  return rows;
};

exports.createQuote = async (eventId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO bookings (client_id, event_id, vendor_id, planner_id, deposit_amount, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [payload.clientId, eventId, payload.vendorId, payload.plannerId, payload.depositAmount]
  );
  return rows[0];
};

exports.listQuotes = async (eventId) => {
  const { rows } = await db.query(
    `SELECT b.*, v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name
     FROM bookings b
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     LEFT JOIN users u ON u.id = b.client_id
     WHERE b.event_id = $1
     ORDER BY b.created_at DESC`,
    [eventId]
  );
  return rows;
};

exports.requestConfirmation = async (id, plannerUserId, payload) => {
  try {
    const { rows: event } = await db.query(
      'SELECT id, client_id FROM events WHERE id = $1', [id]
    );
    if (!event[0]) return null;
    if (event[0].client_id !== plannerUserId) return { unauthorized: true };

    const { rows } = await db.query(
      `UPDATE events SET
         confirmation_status = 'pending',
         confirmation_payment_number = $2,
         confirmation_payment_name = $3,
         confirmation_screenshot_url = $4,
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, payload.paymentNumber, payload.paymentName, payload.screenshotUrl || null]
    );
    return rows[0];
  } catch (err) {
    if (err.message && err.message.includes('confirmation_status')) {
      throw Object.assign(new Error('Please run database migration 014 first'), { status: 500 });
    }
    throw err;
  }
};

exports.listPendingConfirmation = async ({ page = 1, limit = 50 } = {}) => {
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

exports.confirmEvent = async (id, adminId) => {
  try {
    const { rows } = await db.query(
      `UPDATE events SET
         confirmation_status = 'confirmed',
         status = 'published',
         confirmed_by = $2,
         confirmed_at = now(),
         updated_at = now()
       WHERE id = $1 AND confirmation_status = 'pending'
       RETURNING *`,
      [id, adminId]
    );
    return rows[0];
  } catch (err) {
    if (err.message && err.message.includes('confirmation_status')) {
      throw Object.assign(new Error('Please run database migration 014 first'), { status: 500 });
    }
    throw err;
  }
};

exports.rejectEvent = async (id, adminId) => {
  try {
    const { rows } = await db.query(
      `UPDATE events SET
         confirmation_status = 'rejected',
         updated_at = now()
       WHERE id = $1 AND confirmation_status = 'pending'
       RETURNING *`,
      [id, adminId]
    );
    return rows[0];
  } catch (err) {
    if (err.message && err.message.includes('confirmation_status')) {
      throw Object.assign(new Error('Please run database migration 014 first'), { status: 500 });
    }
    throw err;
  }
};
