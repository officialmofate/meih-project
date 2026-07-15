const db = require('../config/database');

exports.listCategories = () => [
  'Decorator', 'MC', 'Photographer', 'Videographer', 'Sound Engineer',
  'Catering', 'Florist', 'Security', 'Transport', 'Accommodation',
  'Printing', 'Branding', 'Lighting', 'Tent & Furniture', 'Makeup',
  'Entertainment', 'Drone Services'
];

exports.create = async (userId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO vendors (user_id, business_name, category)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, payload.businessName, payload.category]
  );
  return rows[0];
};

exports.list = async ({ page = 1, limit = 50, category, search } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`v.category = $${idx++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(v.business_name ILIKE $${idx} OR u.full_name ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT v.*, u.full_name, u.email
     FROM vendors v
     LEFT JOIN users u ON u.id = v.user_id
     ${where}
     ORDER BY v.rating DESC, v.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );
  return rows;
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT v.*, u.full_name, u.email, u.phone
     FROM vendors v
     LEFT JOIN users u ON u.id = v.user_id
     WHERE v.id = $1`,
    [id]
  );
  return rows[0];
};

exports.update = async (id, userId, payload) => {
  const { rows } = await db.query(
    `UPDATE vendors SET
       business_name = COALESCE($3, business_name),
       category = COALESCE($4, category),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, payload.businessName, payload.category]
  );
  return rows[0];
};

exports.findByUserId = async (userId) => {
  const { rows } = await db.query(
    `SELECT v.*, u.full_name, u.email, u.phone
     FROM vendors v
     LEFT JOIN users u ON u.id = v.user_id
     WHERE v.user_id = $1`,
    [userId]
  );
  return rows[0];
};

exports.updateByUserId = async (userId, payload) => {
  const { rows } = await db.query(
    `UPDATE vendors SET
       business_name = COALESCE($2, business_name),
       category = COALESCE($3, category),
       bio = COALESCE($4, bio),
       starting_price = COALESCE($5, starting_price),
       payment_number = COALESCE($6, payment_number),
       payment_name = COALESCE($7, payment_name),
       payment_method = COALESCE($8, payment_method),
       updated_at = now()
     WHERE user_id = $1
     RETURNING *`,
    [userId, payload.businessName, payload.category, payload.bio,
     payload.startingPrice, payload.paymentNumber, payload.paymentName, payload.paymentMethod]
  );
  return rows[0];
};

exports.getPortfolio = async (vendorId) => {
  const { rows } = await db.query(
    `SELECT * FROM vendor_portfolio WHERE vendor_id = $1 ORDER BY created_at DESC`,
    [vendorId]
  );
  return rows;
};

exports.addPortfolioItem = async (vendorId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO vendor_portfolio (vendor_id, title, description, image_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [vendorId, payload.title, payload.description, payload.imageUrl]
  );
  return rows[0];
};

exports.getBookings = async (vendorId) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location, e.event_date,
            u.full_name AS client_name
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN users u ON u.id = b.client_id
     WHERE b.vendor_id = $1
     ORDER BY e.event_date DESC`,
    [vendorId]
  );
  return rows;
};

exports.getReviews = async (vendorId) => {
  const { rows } = await db.query(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.vendor_id = $1
     ORDER BY r.created_at DESC`,
    [vendorId]
  );
  return rows;
};

exports.getAvailability = async (vendorId) => {
  const { rows } = await db.query(
    `SELECT * FROM vendor_availability WHERE vendor_id = $1 ORDER BY date`,
    [vendorId]
  );
  return rows;
};
