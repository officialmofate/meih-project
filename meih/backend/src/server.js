const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');

const errorHandler = require('./middleware/error');
const db = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const plannerRoutes = require('./routes/planners');
const vendorRoutes = require('./routes/vendors');
const bookingRoutes = require('./routes/bookings');
const innovationRoutes = require('./routes/innovation');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const certificateRoutes = require('./routes/certificates');

async function autoMigrate() {
  try {
    const db = require('./config/database');
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) DEFAULT 'unconfirmed'`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_payment_number VARCHAR(50)`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_payment_name VARCHAR(100)`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_screenshot_url VARCHAR(500)`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES users(id)`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12,2) DEFAULT 0`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_number VARCHAR(50)`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_name VARCHAR(100)`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_screenshot_url VARCHAR(500)`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES users(id)`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ`);
    await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_name VARCHAR(200)`);
    await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50)`);
    console.log('[MIGRATION] 014 auto-applied successfully');
  } catch (err) {
    console.error('[MIGRATION] 014 auto-migration error:', err.message);
  }
}

function createApp() {
  const app = express();

  // Run auto-migration after DB is ready
  setTimeout(autoMigrate, 5000);

  // Request ID middleware
  app.use(function (req, res, next) {
    req.id = (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  // Security headers via helmet
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? { reportOnly: true } : false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://meih-project1.onrender.com',
    'http://localhost:3000',
    'http://localhost:4000',
  ].filter(Boolean);

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(compression());

  // ETag support
  app.set('etag', 'weak');

  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Specific rate limiters
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later', code: 'RATE_LIMITED' },
    keyGenerator: function (req) { return req.ip; },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many AI requests, please try again later', code: 'RATE_LIMITED' },
  });

  // Request timeout middleware
  function requestTimeout(ms) {
    return function (req, res, next) {
      req.setTimeout(ms, function () {
        if (!res.headersSent) {
          res.status(408).json({ message: 'Request timeout', code: 'REQUEST_TIMEOUT', requestId: req.id });
        }
      });
      next();
    };
  }

  app.get('/health', function (req, res) { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });
  app.get('/health/db', async function (req, res) {
    var available = db.isAvailable();
    if (!available) {
      var hasUrl = !!process.env.DATABASE_URL;
      if (hasUrl && db.getPool()) {
        try {
          var client = await db.getPool().connect();
          var result = await client.query('SELECT NOW() AS time, current_database() AS db');
          client.release();
          return res.json({ status: 'ok', database: 'connected (retry)', ...result.rows[0] });
        } catch (err) {
          return res.json({ status: 'error', database: 'not connected', hasDatabaseUrl: hasUrl, error: err.message, code: err.code });
        }
      }
      return res.json({ status: 'error', database: 'not connected', hasDatabaseUrl: hasUrl });
    }
    try {
      var qResult = await db.query('SELECT NOW() AS time, current_database() AS db');
      res.json({ status: 'ok', database: 'connected', ...qResult.rows[0] });
    } catch (err) {
      res.json({ status: 'error', database: 'connected but query failed', error: err.message });
    }
  });

  // Apply rate limiters to route groups
  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/users', apiLimiter, userRoutes);
  app.use('/api/v1/events', apiLimiter, eventRoutes);
  app.use('/api/v1/planners', apiLimiter, plannerRoutes);
  app.use('/api/v1/vendors', apiLimiter, vendorRoutes);
  app.use('/api/v1/bookings', apiLimiter, bookingRoutes);
  app.use('/api/v1/innovation', apiLimiter, innovationRoutes);
  app.use('/api/v1/payments', requestTimeout(30000), apiLimiter, paymentRoutes);
  app.use('/api/v1/notifications', apiLimiter, notificationRoutes);
  app.use('/api/v1/admin', apiLimiter, adminRoutes);
  app.use('/api/v1/ai', requestTimeout(60000), aiLimiter, aiRoutes);
  app.use('/api/v1/certificates', apiLimiter, certificateRoutes);

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  var frontendPath = path.join(__dirname, '../../frontend');
  app.use(express.static(frontendPath));

  app.get('*', function (req, res, next) {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.use(errorHandler);

  return app;
}

// Graceful shutdown
function setupGracefulShutdown(server) {
  var shuttingDown = false;

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('[SHUTDOWN] Received ' + signal + ', shutting down gracefully...');

    server.close(function () {
      console.log('[SHUTDOWN] HTTP server closed');
      if (db.getPool()) {
        db.drainPool().then(function () {
          console.log('[SHUTDOWN] Database pool drained');
          process.exit(0);
        }).catch(function (err) {
          console.error('[SHUTDOWN] Error draining pool:', err.message);
          process.exit(1);
        });
      } else {
        process.exit(0);
      }
    });

    // Force kill after 10s
    setTimeout(function () {
      console.error('[SHUTDOWN] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', function () { shutdown('SIGTERM'); });
  process.on('SIGINT', function () { shutdown('SIGINT'); });
}

module.exports = createApp;
module.exports.setupGracefulShutdown = setupGracefulShutdown;
