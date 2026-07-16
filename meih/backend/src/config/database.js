const { Pool } = require('pg');
const dns = require('dns');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

if (databaseUrl) {
  const isSupabase = databaseUrl.includes('supabase');

  let url = databaseUrl;

  async function init() {
    // Parse connection string manually for full control over SSL
    let user, password, host, port, database;
    try {
      const raw = url.replace(/^postgresql:\/\//, '');
      const dbPart = raw.split('@').pop();
      const pathPart = raw.split('@').slice(0, -1).join('@');
      const slashIdx = pathPart.lastIndexOf('/');
      const userInfo = pathPart.slice(0, slashIdx).replace(/^postgresql:\/\//, '');
      const colonIdx = userInfo.indexOf(':');
      user = decodeURIComponent(userInfo.slice(0, colonIdx));
      password = decodeURIComponent(userInfo.slice(colonIdx + 1));
      const hostPort = dbPart.split('/')[0];
      const hpParts = hostPort.split(':');
      host = hpParts[0];
      port = parseInt(hpParts[1], 10) || 5432;
      database = dbPart.split('/')[1].split('?')[0];
    } catch (parseErr) {
      console.error('URL parse error:', parseErr.message);
      return;
    }

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

    console.log('DB connecting to:', host + ':' + port + '/' + database + ' as ' + user);

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
