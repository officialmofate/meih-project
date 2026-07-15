const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, e.name AS event_name
       FROM certificates c
       LEFT JOIN events e ON e.id = c.event_id
       WHERE c.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Certificate not found' });
    const cert = rows[0];
    res.json({ url: cert.file_url || cert.url || null, certificate: cert });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(504).json({ message: 'Certificates table not available yet' });
    }
    next(err);
  }
});

module.exports = router;
