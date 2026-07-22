-- ============================================================
-- MEIH — Full Database Schema for Supabase (PostgreSQL)
-- Run this ONCE on a fresh Supabase database
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'client'
    CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','reviewer','public_voter','admin','superadmin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

-- ============================================================
-- 2. EVENT CATEGORIES
-- ============================================================
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  suggested_fee_usd NUMERIC(10,2)
);

-- ============================================================
-- 3. EVENTS
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  ticket_price NUMERIC(12,2),
  num_payments INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. PLANNERS
-- ============================================================
CREATE TABLE planners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================================
-- 5. VENDORS
-- ============================================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================================
-- 6. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  planner_id UUID REFERENCES planners(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','completed')),
  deposit_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method VARCHAR(30) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','refunded')),
  reference VARCHAR(255),
  payment_number VARCHAR(100),
  payment_name VARCHAR(255),
  screenshot_url TEXT,
  notes TEXT,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. INNOVATION COMPETITIONS
-- ============================================================
CREATE TABLE innovation_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','voting','judging','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. INNOVATION SUBMISSIONS
-- ============================================================
CREATE TABLE innovation_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES innovation_competitions(id) ON DELETE CASCADE,
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

-- ============================================================
-- 10. INNOVATION VOTES
-- ============================================================
CREATE TABLE innovation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id) ON DELETE CASCADE,
  voter_fingerprint VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, voter_fingerprint)
);

-- ============================================================
-- 11. JUDGE SCORES
-- ============================================================
CREATE TABLE judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- ============================================================
-- 12. INNOVATION COMMENTS
-- ============================================================
CREATE TABLE innovation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email','sms','whatsapp','push','in_app')),
  title VARCHAR(255),
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 14. CERTIFICATES
-- ============================================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('participant','winner','judge','mentor','organizer','partner','sponsor','volunteer')),
  reference_id UUID,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  file_url TEXT,
  qr_code_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. PLANNER PORTFOLIO
-- ============================================================
CREATE TABLE planner_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES planners(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 16. VENDOR PORTFOLIO
-- ============================================================
CREATE TABLE vendor_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 17. REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  planner_id UUID REFERENCES planners(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 18. PLANNER AVAILABILITY
-- ============================================================
CREATE TABLE planner_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES planners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 19. VENDOR AVAILABILITY
-- ============================================================
CREATE TABLE vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. EMAIL VERIFICATIONS
-- ============================================================
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_planners_user_id ON planners(user_id);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_planner_id ON bookings(planner_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_innovation_submissions_competition ON innovation_submissions(competition_id);
CREATE INDEX idx_innovation_submissions_user ON innovation_submissions(user_id);
CREATE INDEX idx_innovation_submissions_status ON innovation_submissions(status);
CREATE INDEX idx_innovation_votes_submission ON innovation_votes(submission_id);
CREATE INDEX idx_judge_scores_submission ON judge_scores(submission_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_planner_id ON reviews(planner_id);
CREATE INDEX idx_planner_portfolio_planner ON planner_portfolio(planner_id);
CREATE INDEX idx_vendor_portfolio_vendor ON vendor_portfolio(vendor_id);
CREATE INDEX idx_planner_availability_planner ON planner_availability(planner_id);
CREATE INDEX idx_vendor_availability_vendor ON vendor_availability(vendor_id);

-- ============================================================
-- SEED DATA: Event Categories
-- ============================================================
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

-- ============================================================
-- SEED DATA: Innovation Competitions
-- ============================================================
INSERT INTO innovation_competitions (title, opens_at, closes_at, status) VALUES
  ('Innovation Summit 2026', '2026-01-01T00:00:00Z', '2026-06-30T23:59:59Z', 'voting'),
  ('TZ Youth Hackathon 2026', '2026-03-01T00:00:00Z', '2026-05-31T23:59:59Z', 'open'),
  ('Health Innovation Challenge 2026', '2026-02-15T00:00:00Z', '2026-07-15T23:59:59Z', 'open')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Superadmin
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'sylivesteryakobo@gmail.com',
  crypt('', gen_salt('bf')),
  'Sylvester Yakobo',
  'superadmin',
  'active'
) ON CONFLICT (email, role) DO NOTHING;
