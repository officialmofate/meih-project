const { Pool } = require('pg');
const dns = require('dns');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');

  async function init() {
    // Parse: postgresql://user:pass@host:port/dbname?params
    const raw = databaseUrl.replace(/^postgresql:\/\//, '');
    const lastAt = raw.lastIndexOf('@');
    const userPass = raw.slice(0, lastAt);
    const hostDb = raw.slice(lastAt + 1);

    const colonIdx = userPass.indexOf(':');
    const user = decodeURIComponent(userPass.slice(0, colonIdx));
    const password = decodeURIComponent(userPass.slice(colonIdx + 1));

    const slashIdx = hostDb.indexOf('/');
    const hostPort = hostDb.slice(0, slashIdx);
    const database = hostDb.slice(slashIdx + 1).split('?')[0];

    const hpParts = hostPort.split(':');
    let host = hpParts[0];
    let port = parseInt(hpParts[1], 10) || 5432;

    // Force IPv4 for Supabase on Render
    if (isSupabase) {
      try {
        const addrs = await dns.promises.resolve4(host);
        host = addrs[0];
        console.log('IPv4 resolved to:', host);
      } catch (dnsErr) {
        console.error('DNS IPv4 failed:', dnsErr.message);
      }
    }

    console.log('DB config:', { host, port, database, user });

    const poolConfig = {
      host,
      port,
      database,
      user,
      password,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };

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
