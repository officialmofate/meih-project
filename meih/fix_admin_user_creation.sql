-- Fix missing columns and constraints for admin user creation

-- 1. Add email_verified column (missing from autoMigrate)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. Update role CHECK constraint to include reviewer and superadmin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','reviewer','public_voter','admin','superadmin'));

-- 3. Drop the old UNIQUE (email, role) constraint that caused ON CONFLICT failures
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_role_key;
