-- Seed superadmin: email 'sylivesteryakobo@gmail.com', password is EMPTY.
-- Run in: Supabase -> SQL Editor, or the Dokploy Postgres (psql / pgAdmin).
--
-- NOTE: Login is matched by the `email` column (auth: SELECT * FROM users WHERE email = $1),
-- so the superadmin username is the email. The app verifies login with
-- bcrypt.compare(password || '', password_hash), so an EMPTY password works
-- when password_hash is a bcrypt hash of ''.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Upsert the superadmin row keyed on (email, role).
INSERT INTO users (email, password_hash, full_name, role, status, email_verified)
VALUES (
  'sylivesteryakobo@gmail.com',                      -- username typed at login
  '$2a$10$SJCPYgltfAjhJWy5SgxdtObgDYvMwehzVU32Xwf0PcHqdsoY5PczW', -- bcrypt of '' (empty password)
  'Sylvester Yakobo',
  'superadmin',
  'active',
  true
)
ON CONFLICT (email, role)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  status = EXCLUDED.status,
  email_verified = EXCLUDED.email_verified,
  updated_at = now();

-- Verify
SELECT email, full_name, role, status,
       (password_hash = '$2a$10$SJCPYgltfAjhJWy5SgxdtObgDYvMwehzVU32Xwf0PcHqdsoY5PczW') AS is_empty_password_bcrypt
FROM users
WHERE email = 'sylivesteryakobo@gmail.com';