-- Migration 017: Profile images, voting points, admin rating, per-submission judge assignment

-- User profile image
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Planner profile images (3 portfolio images)
DO $$ BEGIN
  ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_url_1 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_url_2 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE planners ADD COLUMN IF NOT EXISTS image_url_3 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Vendor profile images (3 portfolio images)
DO $$ BEGIN
  ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_url_1 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_url_2 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE vendors ADD COLUMN IF NOT EXISTS image_url_3 TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Voting points and voter role
DO $$ BEGIN
  ALTER TABLE innovation_votes ADD COLUMN IF NOT EXISTS points INT DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE innovation_votes ADD COLUMN IF NOT EXISTS voter_role VARCHAR(50) DEFAULT 'public_voter';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Admin rating on innovations (1-5 stars)
DO $$ BEGIN
  ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS admin_rating INT CHECK (admin_rating >= 1 AND admin_rating <= 5);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Per-submission judge assignment
DO $$ BEGIN
  ALTER TABLE judge_assignments ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES innovation_submissions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
