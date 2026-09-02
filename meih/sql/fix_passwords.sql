-- Fix passwords after Supabase password reset (run in: Supabase -> SQL Editor)
-- Resets juma@gmail.com and the superadmin using your email to the SAME password: Juma123456
-- The bcrypt hashes below were generated with cost 12 (matching the app's register/login code).

UPDATE users
SET password_hash = '$2a$12$VcHLa.tu9KCk6nW1EaHywOoxBaN.6pK0BnTZ6EAKBQBQNUYgzcunu',
    updated_at = now()
WHERE email = 'juma@gmail.com';

UPDATE users
SET password_hash = '$2a$12$keH2V7pdNJOAneiIZ4ixEeE/s6e.6VKxQQH1ynSxbgASPd5XpuZYG',
    updated_at = now()
WHERE role = 'superadmin';

-- Verify (should return rows that now have a $2a$ hash)
SELECT email, role, left(password_hash, 7) AS hash_prefix
FROM users
WHERE email = 'juma@gmail.com' OR role = 'superadmin';