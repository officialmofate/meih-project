const { Pool } = require('pg');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');
  const sslConfig = isSupabase ? { rejectUnauthorized: false } : undefined;

  const poolConfig = {
    connectionString: databaseUrl,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });

  async function testConnection(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        dbAvailable = true;
        console.log('PostgreSQL connected to Supabase');
        return;
      } catch (err) {
        console.error(`DB connection attempt ${i + 1}/${retries} failed:`, err.message);
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    dbAvailable = false;
    console.error('All DB connection attempts failed — running without database');
  }

  testConnection();
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
