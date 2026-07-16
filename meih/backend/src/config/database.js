const { Pool } = require('pg');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });
  // Test connection silently
  pool.query('SELECT 1')
    .then(() => { dbAvailable = true; console.log('PostgreSQL connected'); })
    .catch(() => { dbAvailable = false; console.warn('PostgreSQL not available — running without database'); });
} else {
  console.warn('DATABASE_URL not set — running without database');
}

module.exports = {
  query: async (text, params) => {
    if (!dbAvailable) throw new Error('Database not available');
    return pool.query(text, params);
  },
  pool,
  isAvailable: () => dbAvailable,
};
