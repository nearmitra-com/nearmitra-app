-- Create Provider User Manually (Bypasses Email Rate Limit)
-- Run this in your Supabase SQL Editor

-- 1. Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert the user into auth.users produces the trigger to create profile/roles
-- CHANGE THESE VALUES AS NEEDED:
-- Email: provider@ nearmitra.com
-- Password: Provider@123
-- Name: Test Provider
-- Skill: Electrician
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
  'provider@ nearmitra.com', -- CHANGE EMAIL HERE
  crypt('Provider@123', gen_salt('bf')), -- CHANGE PASSWORD HERE
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "provider", "full_name": "Test Provider", "phone": "9876543210", "skills": ["Electrician"], "address": "123 Main St"}', -- CHANGE DETAILS HERE
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- The trigger 'on_auth_user_created' should automatically create the user_roles and provider_profiles entries.
-- If you experience issues, you can verify with:
-- SELECT * FROM public.provider_profiles WHERE email = 'provider@ nearmitra.com';
