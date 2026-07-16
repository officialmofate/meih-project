-- ═══════════════════════════════════════════════════════════════
-- MEIH Full Schema — paste into Neon SQL Editor and run
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ──
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'client'
    CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','public_voter','admin','superadmin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

-- ── Event Categories ──
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  suggested_fee_usd NUMERIC(10,2)
);

-- ── Events ──
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES event_categories(id),
  location VARCHAR(255),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  budget NUMERIC(12,2),
  event_date TIMESTAMPTZ,
  guest_count INT,
  services TEXT[],
  requirements TEXT,
  quote_deadline TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','confirmed','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Planners ──
CREATE TABLE IF NOT EXISTS planners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  company_name VARCHAR(255) NOT NULL,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_number VARCHAR(100),
  payment_name VARCHAR(255),
  payment_method VARCHAR(50) DEFAULT 'mobile_money',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Vendors ──
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  business_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  bio TEXT,
  starting_price NUMERIC(10,2),
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  payment_number VARCHAR(100),
  payment_name VARCHAR(255),
  payment_method VARCHAR(50) DEFAULT 'mobile_money',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Bookings ──
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  vendor_id UUID REFERENCES vendors(id),
  planner_id UUID REFERENCES planners(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','completed')),
  deposit_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Payments ──
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  method VARCHAR(30) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','refunded')),
  reference VARCHAR(255),
  payment_number VARCHAR(100),
  payment_name VARCHAR(255),
  screenshot_url TEXT,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Innovation Competitions ──
CREATE TABLE IF NOT EXISTS innovation_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','voting','judging','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Innovation Submissions ──
CREATE TABLE IF NOT EXISTS innovation_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  competition_id UUID NOT NULL REFERENCES innovation_competitions(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  problem TEXT,
  solution TEXT,
  impact TEXT,
  technology VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Innovation Votes ──
CREATE TABLE IF NOT EXISTS innovation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id),
  voter_fingerprint VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, voter_fingerprint)
);

-- ── Judge Scores ──
CREATE TABLE IF NOT EXISTS judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id),
  judge_id UUID NOT NULL REFERENCES users(id),
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
  UNIQUE (submission_id, judge_id)
);

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email','sms','whatsapp','push','in_app')),
  title VARCHAR(255),
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Certificates ──
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('participant','winner','judge','mentor','organizer','partner','sponsor','volunteer')),
  reference_id UUID,
  qr_code_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Portfolio Tables ──
CREATE TABLE IF NOT EXISTS planner_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES planners(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Reviews ──
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  planner_id UUID REFERENCES planners(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Availability ──
CREATE TABLE IF NOT EXISTS planner_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES planners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Email Verifications ──
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Innovation Comments ──
CREATE TABLE IF NOT EXISTS innovation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Seed event categories
INSERT INTO event_categories (name, suggested_fee_usd) VALUES
  ('Birthday Events', 15),
  ('Graduation', 20),
  ('Funeral Planning', 20),
  ('Religious Events', 25),
  ('Community Events', 25),
  ('Workshops', 30),
  ('Trainings', 35),
  ('Seminars', 35),
  ('Virtual Events', 40),
  ('Academic Events', 40),
  ('Wedding Planning', 50),
  ('Fundraising Events', 50),
  ('NGO Events', 60),
  ('Medical Events', 60),
  ('Health Conferences', 70),
  ('Scientific Conferences', 75),
  ('Conference Planning', 80),
  ('Corporate Events', 100),
  ('Government Events', 120),
  ('Product Launch', 120),
  ('Exhibitions', 120),
  ('Trade Fair', 150),
  ('Entertainment Events', 150),
  ('Sports Events', 150),
  ('Festival Planning', 180),
  ('Hybrid Events', 180),
  ('Hackathons', 200),
  ('Innovation Summit', 250),
  ('Awards Ceremony', 250)
ON CONFLICT (name) DO NOTHING;

-- Seed innovation competitions
INSERT INTO innovation_competitions (title, opens_at, closes_at, status) VALUES
  ('Innovation Summit 2026', '2026-01-01T00:00:00Z', '2026-06-30T23:59:59Z', 'voting'),
  ('TZ Youth Hackathon 2026', '2026-03-01T00:00:00Z', '2026-05-31T23:59:59Z', 'open'),
  ('Health Innovation Challenge 2026', '2026-02-15T00:00:00Z', '2026-07-15T23:59:59Z', 'open')
ON CONFLICT DO NOTHING;

-- Seed superadmin — no password required
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'sylivesteryakobo@gmail.com',
  crypt('', gen_salt('bf')),
  'Sylvester Yakobo',
  'superadmin',
  'active'
) ON CONFLICT (email, role) DO NOTHING;
