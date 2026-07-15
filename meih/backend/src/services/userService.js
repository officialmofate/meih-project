const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.create = async ({ email, passwordHash, fullName, role = 'client' }) => {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, role, created_at`,
    [email, passwordHash, fullName, role]
  );
  return rows[0];
};

exports.findByEmail = async (email, role) => {
  if (role) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
    return rows[0];
  }
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, email, full_name, role, status, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

exports.update = async (id, patch) => {
  const { rows } = await db.query(
    `UPDATE users SET
       full_name = COALESCE($2, full_name),
       updated_at = now()
     WHERE id = $1
     RETURNING id, email, full_name, role, status`,
    [id, patch.fullName || patch.full_name]
  );
  return rows[0];
};

exports.changePassword = async (id, { oldPassword, newPassword }) => {
  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
  const valid = rows[0] && (await bcrypt.compare(oldPassword, rows[0].password_hash));
  if (!valid) {
    const err = new Error('Current password is incorrect');
    err.status = 400;
    throw err;
  }
  const newHash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [id, newHash]);
};

exports.list = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    'SELECT id, email, full_name, role, status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return rows;
};

exports.remove = async (id) => {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
};

exports.count = async () => {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM users');
  return rows[0].count;
};
