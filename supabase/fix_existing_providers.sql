-- Fix missing user_roles rows for existing provider accounts
-- Run this in Supabase SQL Editor

-- 1. Add user_roles row for any auth user whose user_metadata says 'provider'
--    but who doesn't have a row in user_roles yet
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  (au.raw_user_meta_data->>'role')::public.app_role
FROM auth.users au
WHERE 
  au.raw_user_meta_data->>'role' IN ('provider', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
  )
ON CONFLICT DO NOTHING;

-- 2. Also ensure provider_profiles rows exist for providers
INSERT INTO public.provider_profiles (user_id, full_name, phone, skills, address, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Provider'),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  CASE 
    WHEN au.raw_user_meta_data->'skills' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(au.raw_user_meta_data->'skills'))
    ELSE ARRAY[]::text[]
  END,
  au.raw_user_meta_data->>'address',
  now(),
  now()
FROM auth.users au
WHERE 
  au.raw_user_meta_data->>'role' = 'provider'
  AND NOT EXISTS (
    SELECT 1 FROM public.provider_profiles pp WHERE pp.user_id = au.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verify what we have
SELECT au.email, ur.role, 
       CASE WHEN pp.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.provider_profiles pp ON pp.user_id = au.id
ORDER BY au.created_at DESC;
