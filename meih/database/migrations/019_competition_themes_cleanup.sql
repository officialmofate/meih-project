-- ═══════════════════════════════════════════════════════════════
-- 019 — Competition themes + cleanup of seeded test data
-- 1. Add main theme / sub themes to competitions
-- 2. Add theme selections to submissions
-- 3. Remove seeded test competitions (created by seed scripts, not by an innovation manager)
-- ═══════════════════════════════════════════════════════════════

-- 1. Competition themes
ALTER TABLE innovation_competitions ADD COLUMN IF NOT EXISTS main_theme TEXT;
ALTER TABLE innovation_competitions ADD COLUMN IF NOT EXISTS sub_themes JSONB DEFAULT '[]'::jsonb;

-- 2. Submission theme selections
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS main_theme TEXT;
ALTER TABLE innovation_submissions ADD COLUMN IF NOT EXISTS sub_theme TEXT;

-- 3. Remove seeded test competitions (with their submissions and dependents)
DO $$
DECLARE
  test_titles TEXT[] := ARRAY[
    'Innovation Summit 2026',
    'TZ Youth Hackathon 2026',
    'Health Innovation Challenge 2026'
  ];
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
END $$;
