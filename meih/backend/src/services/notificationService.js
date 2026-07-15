const db = require('../config/database');

exports.list = async (userId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
};

exports.getById = async (id, userId) => {
  const { rows } = await db.query(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0];
};

exports.markRead = async (id, userId) => {
  const { rows } = await db.query(
    `UPDATE notifications SET read_at = now()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING *`,
    [id, userId]
  );
  return rows[0];
};

exports.markAllRead = async (userId) => {
  await db.query(
    'UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
};

exports.remove = async (id, userId) => {
  const { rowCount } = await db.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

exports.create = async (userId, { channel, title, body }) => {
  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, channel, title, body)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, channel, title, body]
  );
  return rows[0];
};

exports.getUnreadCount = async (userId) => {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return rows[0].count;
};
