const db = require('../config/database');

exports.create = async (userId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO planners (user_id, company_name, bio)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, payload.companyName, payload.bio]
  );
  return rows[0];
};

exports.list = async ({ page = 1, limit = 50, search } = {}) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT p.*, u.full_name, u.email
    FROM planners p
    LEFT JOIN users u ON u.id = p.user_id`;
  const params = [];
  let idx = 1;

  if (search) {
    query += ` WHERE p.company_name ILIKE $${idx} OR u.full_name ILIKE $${idx}`;
    params.push(`%${search}%`);
    idx++;
  }

  query += ` ORDER BY p.rating DESC, p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  params.push(limit, offset);

  const { rows } = await db.query(query, params);
  return rows;
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT p.*, u.full_name, u.email, u.phone
     FROM planners p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0];
};

exports.update = async (id, userId, payload) => {
  const { rows } = await db.query(
    `UPDATE planners SET
       company_name = COALESCE($3, company_name),
       bio = COALESCE($4, bio),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, payload.companyName, payload.bio]
  );
  return rows[0];
};

exports.findByUserId = async (userId) => {
  const { rows } = await db.query(
    `SELECT p.*, u.full_name, u.email, u.phone
     FROM planners p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId]
  );
  return rows[0];
};

exports.updateByUserId = async (userId, payload) => {
  const { rows } = await db.query(
    `UPDATE planners SET
       company_name = COALESCE($2, company_name),
       bio = COALESCE($3, bio),
       payment_number = COALESCE($4, payment_number),
       payment_name = COALESCE($5, payment_name),
       payment_method = COALESCE($6, payment_method),
       updated_at = now()
     WHERE user_id = $1
     RETURNING *`,
    [userId, payload.companyName, payload.bio,
     payload.paymentNumber, payload.paymentName, payload.paymentMethod]
  );
  return rows[0];
};

exports.getPortfolio = async (plannerId) => {
  const { rows } = await db.query(
    `SELECT * FROM planner_portfolio WHERE planner_id = $1 ORDER BY created_at DESC`,
    [plannerId]
  );
  return rows;
};

exports.addPortfolioItem = async (plannerId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO planner_portfolio (planner_id, title, description, image_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [plannerId, payload.title, payload.description, payload.imageUrl]
  );
  return rows[0];
};

exports.getEvents = async (plannerId) => {
  const { rows } = await db.query(
    `SELECT e.*, b.status AS booking_status
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     WHERE b.planner_id = $1
     ORDER BY e.event_date DESC`,
    [plannerId]
  );
  return rows;
};

exports.getReviews = async (plannerId) => {
  const { rows } = await db.query(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.planner_id = $1
     ORDER BY r.created_at DESC`,
    [plannerId]
  );
  return rows;
};

exports.getAvailability = async (plannerId) => {
  const { rows } = await db.query(
    `SELECT * FROM planner_availability WHERE planner_id = $1 ORDER BY date`,
    [plannerId]
  );
  return rows;
};

exports.updateAvailability = async (plannerId, payload) => {
  const { from, to } = payload;
  if (!from || !to) {
    const err = new Error('Both from and to dates are required');
    err.status = 400;
    throw err;
  }
  await db.query(
    `DELETE FROM planner_availability WHERE planner_id = $1 AND date >= $2 AND date <= $3`,
    [plannerId, from, to]
  );
  const { rows } = await db.query(
    `INSERT INTO planner_availability (planner_id, date, available)
     SELECT $1, d::date, true
     FROM generate_series($2::date, $3::date, '1 day') AS d
     RETURNING *`,
    [plannerId, from, to]
  );
  return rows;
};
