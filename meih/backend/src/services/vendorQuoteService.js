const db = require('../config/database');

exports.submitQuote = async (vendorUserId, eventId, payload) => {
  const { rows: vendorRows } = await db.query(
    `SELECT id FROM vendors WHERE user_id = $1`, [vendorUserId]
  );
  if (!vendorRows[0]) return null;
  const vendorId = vendorRows[0].id;

  const { rows } = await db.query(
    `INSERT INTO vendor_quotes (event_id, vendor_id, quoted_amount, currency, services, message, timeline)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (event_id, vendor_id) DO UPDATE SET
       quoted_amount = EXCLUDED.quoted_amount,
       services = EXCLUDED.services,
       message = EXCLUDED.message,
       timeline = EXCLUDED.timeline,
       status = 'pending',
       updated_at = now()
     RETURNING *`,
    [eventId, vendorId, payload.quotedAmount, payload.currency || 'TZS',
     payload.services, payload.message || null, payload.timeline || null]
  );
  return rows[0];
};

exports.getVendorQuotes = async (vendorUserId) => {
  const { rows } = await db.query(
    `SELECT vq.*, e.name AS event_name, e.location AS event_location, e.event_date,
            e.status AS event_status, c.name AS category_name,
            u.full_name AS client_name
     FROM vendor_quotes vq
     LEFT JOIN events e ON e.id = vq.event_id
     LEFT JOIN event_categories c ON c.id = e.category_id
     LEFT JOIN users u ON u.id = e.client_id
     WHERE vq.vendor_id = (SELECT id FROM vendors WHERE user_id = $1)
     ORDER BY vq.created_at DESC`,
    [vendorUserId]
  );
  return rows;
};

exports.getEventQuotes = async (eventId) => {
  const { rows } = await db.query(
    `SELECT vq.*, v.business_name AS vendor_name, v.category AS vendor_category,
            u.full_name AS vendor_contact_name
     FROM vendor_quotes vq
     LEFT JOIN vendors v ON v.id = vq.vendor_id
     LEFT JOIN users u ON u.id = v.user_id
     WHERE vq.event_id = $1
     ORDER BY vq.created_at DESC`,
    [eventId]
  );
  return rows;
};

exports.updateQuoteStatus = async (quoteId, status, eventOwnerId) => {
  const { rows: eventCheck } = await db.query(
    `SELECT vq.id, e.client_id
     FROM vendor_quotes vq
     LEFT JOIN events e ON e.id = vq.event_id
     WHERE vq.id = $1`,
    [quoteId]
  );
  if (!eventCheck[0]) return null;
  if (eventCheck[0].client_id !== eventOwnerId) return { unauthorized: true };

  const { rows } = await db.query(
    `UPDATE vendor_quotes SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [quoteId, status]
  );
  return rows[0];
};

exports.hasQuoted = async (vendorUserId, eventId) => {
  const { rows } = await db.query(
    `SELECT id, status FROM vendor_quotes
     WHERE vendor_id = (SELECT id FROM vendors WHERE user_id = $1) AND event_id = $2`,
    [vendorUserId, eventId]
  );
  return rows[0] || null;
};
