-- Add 'superadmin' to the allowed roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','public_voter','admin','superadmin'));

-- Seed superadmin — no password required (empty bcrypt hash)
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'sylivesteryakobo@gmail.com',
  crypt('', gen_salt('bf')),
  'Sylvester Yakobo',
  'superadmin',
  'active'
) ON CONFLICT (email, role) DO NOTHING;
