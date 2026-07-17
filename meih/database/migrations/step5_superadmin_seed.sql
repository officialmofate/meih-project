ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('client','planner','vendor','innovator','innovator_manager','judge','public_voter','admin','superadmin'));

INSERT INTO users (email, password_hash, full_name, role, status, email_verified)
VALUES (
  'sylivesteryakobo@gmail.com',
  crypt('', gen_salt('bf')),
  'Sylvester Yakobo',
  'superadmin',
  'active',
  true
) ON CONFLICT (email, role) DO UPDATE SET email_verified = true;
