-- Migration 018: Reviewer role, event ticket payments, image persistence fix

-- ============================================================
-- 1. Add 'reviewer' to users role CHECK constraint
-- ============================================================
DO $$ BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','reviewer','public_voter','admin','superadmin'));
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ============================================================
-- 2. Event ticket price and number of payments
-- ============================================================
DO $$ BEGIN
  ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(12,2);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE events ADD COLUMN IF NOT EXISTS num_payments INT DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- ============================================================
-- 3. Image persistence fix — store base64 in DB as fallback
-- ============================================================
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS image_base64 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS image_url TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS image_base64 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- ============================================================
-- 4. Reviewer assignments table
-- ============================================================
CREATE TABLE IF NOT EXISTS reviewer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES innovation_competitions(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES innovation_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviewer_assignments_reviewer ON reviewer_assignments(reviewer_id);

-- ============================================================
-- 5. Reviewer scores table (mirrors judge_scores 10 criteria)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviewer_scores (
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
);
CREATE INDEX IF NOT EXISTS idx_reviewer_scores_submission ON reviewer_scores(submission_id);
