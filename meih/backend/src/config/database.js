const { Pool } = require('pg');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');

  // Ensure sslmode=require for Supabase
  let url = databaseUrl;
  if (isSupabase && !url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  async function startPool(host, port, db, user, pass) {
    const poolConfig = {
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

    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });

    for (let i = 0; i < 3; i++) {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        dbAvailable = true;
        console.log('PostgreSQL connected:', host + ':' + port + '/' + db);
        return;
      } catch (err) {
        console.error('DB attempt ' + (i+1) + '/3 failed:', err.message);
        if (i < 2) await new Promise(r => setTimeout(r, 3000));
      }
    }
    console.error('All DB connection attempts failed');
  }

  try {
    // Parse URL manually - handles passwords with @
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
    const hostname = hostParts[0];
    const port = parseInt(hostParts[1], 10) || 5432;

    console.log('DB host:', hostname);

    // Force IPv4 resolution for Supabase on Render
    if (isSupabase) {
      const { lookup } = require('dns').promises;
      const { address } = await lookup(hostname, { family: 4 });
      console.log('Resolved IPv4:', address);
      startPool(address, port, db, user, pass);
    } else {
      startPool(hostname, port, db, user, pass);
    }
  } catch (err) {
    console.error('DB init error:', err.message);
    console.error('Running without database');
  }
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
