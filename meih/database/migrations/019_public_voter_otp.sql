-- Migration: Public voter OTP + one-vote-per-user voting
-- Run in your Postgres SQL editor (e.g. Render SQL editor). Idempotent — safe to re-run.
-- Mirrors the autoMigrate() steps in src/server.js.

-- 1. New columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS vote_otp VARCHAR(10);
ALTER TABLE innovation_votes ADD COLUMN IF NOT EXISTS voter_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Drop the old fingerprint uniqueness (column is kept, now stores the voter id)
ALTER TABLE innovation_votes DROP CONSTRAINT IF EXISTS innovation_votes_submission_id_voter_fingerprint_key;
DROP INDEX IF EXISTS innovation_votes_submission_id_voter_fingerprint_key;

-- 3. Unique index: one vote per public_voter per submission
CREATE UNIQUE INDEX IF NOT EXISTS idx_innovation_votes_submission_voter
  ON innovation_votes(submission_id, voter_id);

-- 4. Backfill unique 6-digit OTPs for existing public voters
DO $$
DECLARE
  v RECORD;
  otp TEXT;
  tries INT;
BEGIN
  FOR v IN SELECT id FROM users WHERE role = 'public_voter' AND (vote_otp IS NULL OR vote_otp = '') LOOP
    otp := NULL;
    tries := 0;
    WHILE otp IS NULL AND tries < 50 LOOP
      otp := lpad(floor(random() * 1000000)::int::text, 6, '0');
      IF EXISTS (SELECT 1 FROM users WHERE vote_otp = otp AND id <> v.id) THEN
        otp := NULL;
        tries := tries + 1;
      END IF;
    END LOOP;
    IF otp IS NOT NULL THEN
      UPDATE users SET vote_otp = otp, updated_at = now() WHERE id = v.id;
    END IF;
  END LOOP;
END $$;

-- Optional verification
-- SELECT id, email, role, vote_otp FROM users WHERE role = 'public_voter';
