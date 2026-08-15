-- ============================================================
-- 020. CERTIFICATE SIGNATURES + MANAGER CLOSED VOTING
-- ============================================================

-- Users can upload a signature used on certificates (director / judge)
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_base64 TEXT;

-- Innovation manager manually closes voting for all submissions of a competition
ALTER TABLE innovation_competitions ADD COLUMN IF NOT EXISTS votes_closed_at TIMESTAMPTZ;
