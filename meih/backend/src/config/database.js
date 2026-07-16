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

    if (isSupabase) {
      try {
        const afterProto = url.replace(/^postgresql:\/\//, '');
        const authority = afterProto.split('@').pop();
        const hostname = authority.split('/')[0].split(':')[0];
        const addrs = await dns.promises.resolve4(hostname);
        poolConfig.host = addrs[0];
        delete poolConfig.connectionString;
        // Re-extract user/pass for direct connection
        const userInfo = url.replace(/^postgresql:\/\//, '').split('@')[0];
        const colonIdx = userInfo.indexOf(':');
        poolConfig.user = decodeURIComponent(userInfo.slice(0, colonIdx));
        poolConfig.password = decodeURIComponent(userInfo.slice(colonIdx + 1));
        poolConfig.database = authority.split('/')[0].split('?')[0];
        poolConfig.port = parseInt(authority.split(':')[1], 10) || 5432;
        console.log('IPv4 resolved:', hostname, '->', addrs[0]);
      } catch (dnsErr) {
        console.error('DNS IPv4 failed, using connectionString:', dnsErr.message);
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
    console.error('All DB connection attempts failed');
  }

  init().catch((err) => {
    console.error('DB init error:', err.message);
  });
} else {
  console.warn('DATABASE_URL not set');
}

module.exports = {
  query: async (text, params) => {
    if (!dbAvailable) throw new Error('Database not available');
    return pool.query(text, params);
  },
  getPool: () => pool,
  isAvailable: () => dbAvailable,
};
