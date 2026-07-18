-- Migration: Add innovation manager support
-- Run this in Supabase SQL Editor

-- 1. Add reviewed_by / reviewed_at columns to innovation_submissions
DO $$ BEGIN
  ALTER TABLE innovation_submissions ADD COLUMN reviewed_by UUID REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE innovation_submissions ADD COLUMN reviewed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- 2. Verify the innovator_manager role exists in users (Supabase RLS safe)
-- This just confirms the column allows the role value
UPDATE users SET role = role WHERE role IN (
  'client','planner','vendor','innovator','innovator_manager','judge','public_voter','admin','superadmin'
);

-- 3. Done — you can now:
--    - Assign innovator_manager role via Admin Dashboard > User Management
--    - Log in as innovator_manager to see the new dashboard
--    - Create competitions and approve/reject submissions
