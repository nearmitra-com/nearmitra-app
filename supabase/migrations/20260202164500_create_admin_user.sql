-- Create Admin User SQL Script
-- Run this in your Supabase SQL Editor

-- 1. Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert the user into auth.users
-- We use ON CONFLICT DO NOTHING to avoid errors if the user exists.
-- If you want to reset the password, you'd need a different query.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sakshamshinde@ nearmitra.com',
  crypt('Saksham@10', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin", "full_name": "System Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Note: The trigger we added earlier should automatically create the user_roles entry.
-- If it doesn't (because triggers on auth.users can be tricky), we manually ensure it:

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'sakshamshinde@ nearmitra.com'
ON CONFLICT (user_id, role) DO NOTHING;
