const { Pool } = require('pg');
const dns = require('dns');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');

  let url = databaseUrl;
  if (isSupabase && !url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  async function init() {
    const poolConfig = {
      connectionString: url,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };

    // For Supabase on Render: force IPv4 by resolving A records
    if (isSupabase) {
      try {
        const afterProto = url.replace(/^postgresql:\/\//, '');
        const authority = afterProto.split('@').pop();
        const hostname = authority.split('/')[0].split(':')[0];
        const addrs = await dns.promises.resolve4(hostname);
        poolConfig.host = addrs[0];
        console.log('IPv4 resolved:', hostname, '->', addrs[0]);
      } catch (dnsErr) {
        console.error('DNS IPv4 resolution failed, using default:', dnsErr.message);
      }
    }

    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });

    for (let i = 0; i < 3; i++) {
      try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT current_database() AS db, NOW() AS time');
        client.release();
        dbAvailable = true;
        console.log('PostgreSQL connected:', JSON.stringify(rows[0]));
        return;
      } catch (err) {
        console.error('DB attempt ' + (i + 1) + '/3 failed:', err.message);
        if (i < 2) await new Promise(r => setTimeout(r, 3000));
      }
    }
    console.error('All DB connection attempts failed — running without database');
  }

  init().catch((err) => {
    console.error('DB init error:', err.message);
  });
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
