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
const vendorQuoteRoutes = require('./routes/vendorQuotes');

async function autoMigrate() {
  try {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../../uploads');
    const profilesDir = path.join(uploadsDir, 'profiles');
    const paymentsDir = path.join(uploadsDir, 'payments');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });
    if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

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
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS image_base64 TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`);
    // Update role CHECK constraint to include all valid roles
    await db.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
      END IF;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','reviewer','public_voter','admin','superadmin'));
    END $$`);
    // Drop old UNIQUE (email, role) constraint that prevents admin user creation
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_role_key`);
    // Add base64 columns for image persistence on all tables
    await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_base64 TEXT`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS confirmation_screenshot_base64 TEXT`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS payment_screenshot_base64 TEXT`);
    await db.query(`ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_base64_1 TEXT`);
    await db.query(`ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_base64_2 TEXT`);
    await db.query(`ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_base64_3 TEXT`);
    await db.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_base64_1 TEXT`);
    await db.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_base64_2 TEXT`);
    await db.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_base64_3 TEXT`);
    await db.query(`ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_url_1 TEXT`);
    await db.query(`ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_url_2 TEXT`);
    await db.query(`ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_url_3 TEXT`);
    await db.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_url_1 TEXT`);
    await db.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_url_2 TEXT`);
    await db.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_url_3 TEXT`);
    await db.query(`ALTER TABLE innovation_votes ADD COLUMN IF NOT EXISTS points INT DEFAULT 1`);
    await db.query(`ALTER TABLE innovation_votes ADD COLUMN IF NOT EXISTS voter_role VARCHAR(50) DEFAULT 'public_voter'`);
    // Public voter OTP + vote ownership — unique 6-digit OTP per voter, one vote per user per submission
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS vote_otp VARCHAR(10)`);
    await db.query(`ALTER TABLE innovation_votes ADD COLUMN IF NOT EXISTS voter_id UUID REFERENCES users(id) ON DELETE SET NULL`);
    await db.query(`ALTER TABLE innovation_votes DROP CONSTRAINT IF EXISTS innovation_votes_submission_id_voter_fingerprint_key`);
    await db.query(`DROP INDEX IF EXISTS innovation_votes_submission_id_voter_fingerprint_key`);
    await db.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_innovation_votes_submission_voter') THEN
        CREATE UNIQUE INDEX idx_innovation_votes_submission_voter ON innovation_votes(submission_id, voter_id);
      END IF;
    END $$`);
    // Backfill voting OTPs for existing public voters created before this feature
    try {
      const { rows: voters } = await db.query(
        "SELECT id FROM users WHERE role = 'public_voter' AND (vote_otp IS NULL OR vote_otp = '')"
      );
      for (const v of voters) {
        let otp = null;
        for (let i = 0; i < 50; i++) {
          const candidate = String(Math.floor(100000 + Math.random() * 900000));
          const dup = await db.query('SELECT 1 FROM users WHERE vote_otp = $1 LIMIT 1', [candidate]);
          if (dup.rows.length === 0) { otp = candidate; break; }
        }
        if (otp) await db.query('UPDATE users SET vote_otp = $2, updated_at = now() WHERE id = $1', [v.id, otp]);
      }
    } catch (otpErr) {
      console.error('[MIGRATION] Vote OTP backfill error:', otpErr.message);
    }
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS admin_rating INT`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS image_base64 TEXT`);
    // 019 — competition themes + cleanup of seeded test data
    await db.query(`ALTER TABLE innovation_competitions ADD COLUMN IF NOT EXISTS main_theme TEXT`);
    await db.query(`ALTER TABLE innovation_competitions ADD COLUMN IF NOT EXISTS sub_themes JSONB DEFAULT '[]'::jsonb`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS main_theme TEXT`);
    await db.query(`ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS sub_theme TEXT`);
    // 020 — certificate signatures + manager-closed voting
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_base64 TEXT`);
    await db.query(`ALTER TABLE innovation_competitions ADD COLUMN IF NOT EXISTS votes_closed_at TIMESTAMPTZ`);
    await db.query(`
      DO $$
      DECLARE
        test_titles TEXT[] := ARRAY['Innovation Summit 2026','TZ Youth Hackathon 2026','Health Innovation Challenge 2026'];
        v_sub RECORD;
      BEGIN
        FOR v_sub IN
          SELECT s.id
          FROM innovation_submissions s
          JOIN innovation_competitions c ON c.id = s.competition_id
          WHERE c.title = ANY (test_titles)
        LOOP
          DELETE FROM innovation_votes WHERE submission_id = v_sub.id;
          DELETE FROM innovation_comments WHERE submission_id = v_sub.id;
          DELETE FROM judge_scores WHERE submission_id = v_sub.id;
          DELETE FROM reviewer_scores WHERE submission_id = v_sub.id;
          DELETE FROM judge_assignments WHERE submission_id = v_sub.id;
          DELETE FROM reviewer_assignments WHERE submission_id = v_sub.id;
          DELETE FROM innovation_submissions WHERE id = v_sub.id;
        END LOOP;
        DELETE FROM innovation_competitions WHERE title = ANY (test_titles);
      END $$`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(12,2)`);
    await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS num_payments INT DEFAULT 1`);
    await db.query(`ALTER TABLE judge_assignments ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES innovation_submissions(id) ON DELETE CASCADE`);
    await db.query(`ALTER TABLE judge_assignments DROP CONSTRAINT IF EXISTS judge_assignments_judge_id_competition_id_key`);
    await db.query(`CREATE TABLE IF NOT EXISTS vendor_quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      vendor_id UUID NOT NULL REFERENCES vendors(id),
      quoted_amount NUMERIC(12,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
      services TEXT NOT NULL,
      message TEXT,
      timeline VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','accepted','rejected','withdrawn')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_vendor_quotes_event ON vendor_quotes(event_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_vendor_quotes_vendor ON vendor_quotes(vendor_id)`);
    await db.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vendor_quotes_unique_per_event') THEN CREATE UNIQUE INDEX idx_vendor_quotes_unique_per_event ON vendor_quotes(event_id, vendor_id); END IF; END $$`);
    // Reviewer tables
    await db.query(`CREATE TABLE IF NOT EXISTS reviewer_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      competition_id UUID NOT NULL REFERENCES innovation_competitions(id) ON DELETE CASCADE,
      submission_id UUID REFERENCES innovation_submissions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS reviewer_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID NOT NULL REFERENCES innovation_submissions(id) ON DELETE CASCADE,
      reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      innovation_score INT,
      impact_score INT,
      feasibility_score INT,
      scalability_score INT,
      sustainability_score INT,
      technology_score INT,
      business_model_score INT,
      social_impact_score INT,
      market_readiness_score INT,
      presentation_score INT,
      comments TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (submission_id, reviewer_id)
    )`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_reviewer ON reviewer_assignments(reviewer_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_reviewer_scores_submission ON reviewer_scores(submission_id)`);

    // Performance indexes for 1000+ user scale
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_innovation_submissions_competition_id ON innovation_submissions(competition_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_innovation_submissions_user_id ON innovation_submissions(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_innovation_submissions_status ON innovation_submissions(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_innovation_votes_submission_id ON innovation_votes(submission_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await db.query(`CREATE TABLE IF NOT EXISTS event_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) UNIQUE NOT NULL,
      suggested_fee_usd NUMERIC(10,2)
    )`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Wedding', 50 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Wedding')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Corporate Event', 100 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Corporate Event')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Birthday Party', 15 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Birthday Party')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Conference', 80 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Conference')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Concert', 150 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Concert')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Workshop', 30 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Workshop')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Exhibition', 120 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Exhibition')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Fundraiser', 50 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Fundraiser')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Community Event', 25 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Community Event')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Cultural Festival', 180 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Cultural Festival')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Sports Event', 150 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Sports Event')`);
    await db.query(`INSERT INTO event_categories (name, suggested_fee_usd) SELECT 'Other', 0 WHERE NOT EXISTS (SELECT 1 FROM event_categories WHERE name = 'Other')`);
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

  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedOrigins = [
    ...envOrigins,
    process.env.FRONTEND_URL,
    'https://meih.onrender.com',
    'https://meih-project1.onrender.com',
    'https://meih-project-1.onrender.com',
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
    windowMs: 60 * 1000,
    max: 15,
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

  app.get('/sitemap.xml', async function (req, res) {
    try {
      var baseUrl = 'https://meih.onrender.com';
      var urls = [
        { loc: baseUrl + '/', priority: '1.0' },
        { loc: baseUrl + '/pages/events.html', priority: '0.8' },
        { loc: baseUrl + '/pages/innovation.html', priority: '0.8' },
        { loc: baseUrl + '/pages/vendors.html', priority: '0.8' },
        { loc: baseUrl + '/pages/planners.html', priority: '0.8' },
        { loc: baseUrl + '/pages/leaderboard.html', priority: '0.6' },
      ];
      try {
        var db2 = require('./config/database');
        var events = await db2.query('SELECT id, updated_at FROM events WHERE status = \'published\' ORDER BY created_at DESC LIMIT 500');
        if (Array.isArray(events.rows)) events.rows.forEach(function (e) { urls.push({ loc: baseUrl + '/pages/event-detail.html?id=' + e.id, priority: '0.5', lastmod: e.updated_at }); });
        var subs = await db2.query('SELECT id, updated_at FROM innovation_submissions WHERE status = \'approved\' ORDER BY created_at DESC LIMIT 500');
        if (Array.isArray(subs.rows)) subs.rows.forEach(function (s) { urls.push({ loc: baseUrl + '/pages/innovation-detail.html?id=' + s.id, priority: '0.5', lastmod: s.updated_at }); });
        var planners = await db2.query('SELECT id, updated_at FROM planners ORDER BY created_at DESC LIMIT 500');
        if (Array.isArray(planners.rows)) planners.rows.forEach(function (p) { urls.push({ loc: baseUrl + '/pages/planner-detail.html?id=' + p.id, priority: '0.5', lastmod: p.updated_at }); });
        var vendors = await db2.query('SELECT id, updated_at FROM vendors ORDER BY created_at DESC LIMIT 500');
        if (Array.isArray(vendors.rows)) vendors.rows.forEach(function (v) { urls.push({ loc: baseUrl + '/pages/vendor-detail.html?id=' + v.id, priority: '0.5', lastmod: v.updated_at }); });
      } catch (e) { console.error('[SITEMAP] DB query error:', e.message); }
      var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      urls.forEach(function (u) {
        xml += '  <url>\n    <loc>' + u.loc + '</loc>\n';
        if (u.lastmod) xml += '    <lastmod>' + new Date(u.lastmod).toISOString().split('T')[0] + '</lastmod>\n';
        xml += '    <priority>' + u.priority + '</priority>\n  </url>\n';
      });
      xml += '</urlset>';
      res.setHeader('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) { res.status(500).send('Sitemap generation failed'); }
  });
  app.get('/robots.txt', function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.send('User-agent: *\nAllow: /\nSitemap: https://meih.onrender.com/sitemap.xml\n');
  });
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
  app.use('/api/v1/vendor-quotes', apiLimiter, vendorQuoteRoutes);

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Image serve cache — avoids repeated UNION LIKE queries
  const imageCache = new Map();
  const IMAGE_CACHE_MAX = 500;

  app.get('/uploads/serve/*', async (req, res) => {
    const fs = require('fs');
    const requestedPath = req.params[0] || req.params.filename || '';
    const filePath = path.join(__dirname, '../../uploads', requestedPath);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Check memory cache first
    const cached = imageCache.get(requestedPath);
    if (cached && Date.now() - cached.ts < 3600000) {
      const ext = path.extname(requestedPath).toLowerCase().replace('.', '');
      const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
      res.setHeader('Content-Type', 'image/' + (mimeMap[ext] || 'jpeg'));
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buf);
    }

    try {
      let rows = [];
      try {
        const result = await db.query(
          `SELECT image_base64, image_url FROM users WHERE image_url LIKE $1
           UNION ALL
           SELECT image_base64, image_url FROM innovation_submissions WHERE image_url LIKE $1
           UNION ALL
           SELECT screenshot_base64 AS image_base64, screenshot_url AS image_url FROM payments WHERE screenshot_url LIKE $1
           UNION ALL
           SELECT confirmation_screenshot_base64 AS image_base64, confirmation_screenshot_url AS image_url FROM events WHERE confirmation_screenshot_url LIKE $1
           UNION ALL
           SELECT payment_screenshot_base64 AS image_base64, payment_screenshot_url AS image_url FROM innovation_submissions WHERE payment_screenshot_url LIKE $1
           UNION ALL
           SELECT image_base64_1 AS image_base64, image_url_1 AS image_url FROM planners WHERE image_url_1 LIKE $1
           UNION ALL
           SELECT image_base64_2 AS image_base64, image_url_2 AS image_url FROM planners WHERE image_url_2 LIKE $1
           UNION ALL
           SELECT image_base64_3 AS image_base64, image_url_3 AS image_url FROM planners WHERE image_url_3 LIKE $1
           UNION ALL
           SELECT image_base64_1 AS image_base64, image_url_1 AS image_url FROM vendors WHERE image_url_1 LIKE $1
           UNION ALL
           SELECT image_base64_2 AS image_base64, image_url_2 AS image_url FROM vendors WHERE image_url_2 LIKE $1
           UNION ALL
           SELECT image_base64_3 AS image_base64, image_url_3 AS image_url FROM vendors WHERE image_url_3 LIKE $1
           LIMIT 1`,
          ['%' + requestedPath]
        );
        rows = result.rows;
      } catch (unionErr) {
        console.error('[IMAGE-SERVE] Full UNION query failed, trying simplified fallback:', unionErr.message);
        const fallback = await db.query(
          `SELECT image_base64, image_url FROM users WHERE image_url LIKE $1
           UNION ALL
           SELECT image_base64, image_url FROM innovation_submissions WHERE image_url LIKE $1
           UNION ALL
           SELECT screenshot_base64 AS image_base64, screenshot_url AS image_url FROM payments WHERE screenshot_url LIKE $1
           LIMIT 1`,
          ['%' + requestedPath]
        );
        rows = fallback.rows;
      }
      if (rows.length > 0 && rows[0].image_base64) {
        const ext = path.extname(requestedPath).toLowerCase().replace('.', '');
        const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
        const mime = mimeMap[ext] || 'jpeg';
        const buf = Buffer.from(rows[0].image_base64, 'base64');
        // Cache it
        if (imageCache.size > IMAGE_CACHE_MAX) {
          const firstKey = imageCache.keys().next().value;
          imageCache.delete(firstKey);
        }
        imageCache.set(requestedPath, { buf, ts: Date.now() });
        res.setHeader('Content-Type', 'image/' + mime);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buf);
      }
    } catch (e) {
      console.error('[UPLOADS] Base64 fallback error:', e.message);
    }
    res.status(404).json({ message: 'Image not found' });
  });

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

    try {
      var scheduler = require('./services/schedulerService');
      scheduler.stop();
    } catch (e) {}

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
