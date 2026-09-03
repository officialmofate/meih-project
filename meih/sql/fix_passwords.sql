-- Fix the superadmin password (run in: Supabase -> SQL Editor)
-- Resets the superadmin (sylivesteryakobo@gmail.com) password to: Juma123456
-- The bcrypt hash below was generated with cost 12 (matching the app's register/login code).

UPDATE users
SET password_hash = '$2a$12$keH2V7pdNJOAneiIZ4ixEeE/s6e.6VKxQQH1ynSxbgASPd5XpuZYG',
    updated_at = now()
WHERE role = 'superadmin';

-- Verify (should return rows that now have a $2a$ hash)
SELECT email, role, left(password_hash, 7) AS hash_prefix
FROM users
WHERE role = 'superadmin';