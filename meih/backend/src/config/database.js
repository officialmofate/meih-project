const { Pool } = require('pg');
const dns = require('dns');
const { databaseUrl } = require('./env');

// Force IPv4 — Render doesn't support outbound IPv6
dns.setDefaultResultOrder('ipv4first');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');

  // Ensure sslmode=require for Supabase
  let url = databaseUrl;
  if (isSupabase && !url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  // Parse URL manually to handle passwords with special chars like @
  let poolConfig;
  try {
    // Extract components manually - the URL format is:
    // postgresql://user:password@host:port/database
    const afterProtocol = url.replace(/^postgresql:\/\//, '');
    const slashIdx = afterProtocol.lastIndexOf('/');
    const db = afterProtocol.slice(slashIdx + 1).split('?')[0];
    const authority = afterProtocol.slice(0, slashIdx);
    const lastAt = authority.lastIndexOf('@');
    const userPass = authority.slice(0, lastAt);
    const hostPort = authority.slice(lastAt + 1);
    const colonIdx = userPass.indexOf(':');
    const user = colonIdx >= 0 ? userPass.slice(0, colonIdx) : userPass;
    const pass = colonIdx >= 0 ? userPass.slice(colonIdx + 1) : '';
    const hostParts = hostPort.split(':');
    const host = hostParts[0];
    const port = parseInt(hostParts[1], 10) || 5432;

    poolConfig = {
      host,
      port,
      database: db,
      user: decodeURIComponent(user),
      password: decodeURIComponent(pass),
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };
    console.log('DB config parsed:', { host, port, database: db, user });
  } catch (parseErr) {
    console.error('URL parse failed, using connectionString:', parseErr.message);
    poolConfig = {
      connectionString: url,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });

  async function testConnection(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT 1 AS ok');
        client.release();
        dbAvailable = true;
        console.log('PostgreSQL connected:', poolConfig.host + ':' + poolConfig.port + '/' + poolConfig.database);
        return;
      } catch (err) {
        console.error(`DB attempt ${i + 1}/${retries} failed:`, err.message);
        if (i < retries - 1) await new Promise(r => setTimeout(r, 3000));
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
