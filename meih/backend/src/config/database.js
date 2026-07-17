const { Pool } = require('pg');
const dns = require('dns');
const { databaseUrl } = require('./env');

let pool = null;
let dbAvailable = false;

// Query cache for queryWithCache
const queryCache = new Map();
let cacheIdCounter = 0;

// Pool monitoring
const poolStats = {
  totalQueries: 0,
  slowQueries: 0,
  lastPoolCheck: null,
  activeConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
};

// Slow query threshold in ms
const SLOW_QUERY_THRESHOLD = 500;

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

    // Pool monitoring: sample stats periodically
    if (process.env.NODE_ENV !== 'production') {
      setInterval(function () {
        if (pool) {
          poolStats.activeConnections = pool.totalCount - pool.idleCount;
          poolStats.idleConnections = pool.idleCount;
          poolStats.waitingClients = pool.waitingCount;
          poolStats.lastPoolCheck = new Date().toISOString();
        }
      }, 30000);
    }

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
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    poolStats.totalQueries++;

    // Log slow queries in development
    if (process.env.NODE_ENV !== 'production' && duration > SLOW_QUERY_THRESHOLD) {
      poolStats.slowQueries++;
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'SLOW_QUERY',
        duration: duration + 'ms',
        query: text.substring(0, 200),
        rowCount: result.rowCount,
      }));
    }

    return result;
  },

  queryWithCache: async (text, params, cacheKey, ttlMs) => {
    if (!dbAvailable) throw new Error('Database not available');

    ttlMs = ttlMs || 60000;
    const now = Date.now();

    // Check cache
    if (cacheKey && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey);
      if (now - cached.timestamp < ttlMs) {
        return cached.result;
      }
      queryCache.delete(cacheKey);
    }

    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    poolStats.totalQueries++;

    if (process.env.NODE_ENV !== 'production' && duration > SLOW_QUERY_THRESHOLD) {
      poolStats.slowQueries++;
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'SLOW_QUERY',
        duration: duration + 'ms',
        query: text.substring(0, 200),
        rowCount: result.rowCount,
      }));
    }

    // Store in cache
    if (cacheKey) {
      // Evict oldest entries if cache grows too large (max 1000 entries)
      if (queryCache.size > 1000) {
        const firstKey = queryCache.keys().next().value;
        queryCache.delete(firstKey);
      }
      queryCache.set(cacheKey, { result: result, timestamp: now });
    }

    return result;
  },

  invalidateCache: function (pattern) {
    if (!pattern) {
      queryCache.clear();
      return;
    }
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  },

  getPool: () => pool,

  isAvailable: () => dbAvailable,

  getPoolStats: function () {
    if (pool) {
      poolStats.activeConnections = pool.totalCount - pool.idleCount;
      poolStats.idleConnections = pool.idleCount;
      poolStats.waitingClients = pool.waitingCount;
    }
    return { ...poolStats };
  },

  drainPool: async function () {
    if (!pool) return;
    try {
      // Clear query cache
      queryCache.clear();
      // End all connections
      await pool.end();
      dbAvailable = false;
      pool = null;
    } catch (err) {
      console.error('Error draining pool:', err.message);
      throw err;
    }
  },
};
