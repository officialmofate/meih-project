-- Seed superadmin: email 'sylivesteryakobo@gmail.com', password is EMPTY.
-- Run in: Supabase -> SQL Editor, or the Dokploy Postgres (psql / pgAdmin).
--
-- NOTE: Login is matched by the `email` column (auth: SELECT * FROM users WHERE email = $1),
-- so the superadmin username is the email. The app verifies login with
-- bcrypt.compare(password || '', password_hash), so an EMPTY password works
-- when password_hash is a bcrypt hash of ''.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Idempotent insert: only inserts if the superadmin row is not already present.
-- Uses WHERE NOT EXISTS so it does NOT depend on any (email, role) unique constraint.
INSERT INTO users (email, password_hash, full_name, role, status, email_verified)
SELECT
  'sylivesteryakobo@gmail.com',                                 -- username typed at login
  '$2a$10$SJCPYgltfAjhJWy5SgxdtObgDYvMwehzVU32Xwf0PcHqdsoY5PczW', -- bcrypt of '' (empty password)
  'Sylvester Yakobo',
  'superadmin',
  'active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'sylivesteryakobo@gmail.com' AND role = 'superadmin'
);

-- If the row already exists, make sure its password_hash matches the empty-password bcrypt.
UPDATE users
SET password_hash = '$2a$10$SJCPYgltfAjhJWy5SgxdtObgDYvMwehzVU32Xwf0PcHqdsoY5PczW',
    status = 'active',
    email_verified = true,
    updated_at = now()
WHERE email = 'sylivesteryakobo@gmail.com' AND role = 'superadmin';

-- Verify
SELECT email, full_name, role, status,
       (password_hash = '$2a$10$SJCPYgltfAjhJWy5SgxdtObgDYvMwehzVU32Xwf0PcHqdsoY5PczW') AS is_empty_password_bcrypt
FROM users
WHERE email = 'sylivesteryakobo@gmail.com';