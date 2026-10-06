-- ================================================================
-- FIX: Customer Signup
-- Problem: app_role ENUM only contains 'admin' | 'provider'.
--          When a customer signs up, the trigger tries to cast
--          'customer' to app_role and FAILS, blocking registration.
-- Solution:
--   1. Add 'customer' to the app_role enum.
--   2. Update handle_new_user() to gracefully handle 'customer'.
--   3. Ensure profiles table RLS allows anon inserts via trigger.
-- Run this in your Supabase SQL Editor.
-- ================================================================

-- STEP 1: Add 'customer' to the app_role enum
-- (ALTER TYPE ... ADD VALUE is safe and non-destructive)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- STEP 2: Replace the handle_new_user trigger function
-- Now handles: admin, provider, AND customer roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_str TEXT;
  v_role     public.app_role;
  v_skills   TEXT[];
BEGIN
  -- Extract role string from metadata
  v_role_str := new.raw_user_meta_data->>'role';

  -- If no role provided at all, default to 'customer'
  IF v_role_str IS NULL OR v_role_str = '' THEN
    v_role_str := 'customer';
  END IF;

  -- Cast to enum (now safely includes 'customer')
  BEGIN
    v_role := v_role_str::public.app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Unknown role string — default to customer, never block signup
    v_role := 'customer';
  END;

  -- Insert into user_roles for ALL roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- For providers: also create provider_profiles row
  IF v_role = 'provider' THEN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(new.raw_user_meta_data->'skills', '[]'::jsonb)
      )
    ) INTO v_skills;

    INSERT INTO public.provider_profiles (
      user_id,
      full_name,
      phone,
      skills,
      address,
      created_at,
      updated_at
    ) VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      COALESCE(v_skills, '{}'),
      new.raw_user_meta_data->>'address',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- For customers: create a profiles row
  IF v_role = 'customer' THEN
    INSERT INTO public.profiles (
      user_id,
      full_name,
      phone,
      email,
      created_at,
      updated_at
    ) VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      new.email,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- STEP 3: Ensure the trigger is attached (recreate if missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Fix RLS on profiles so the trigger (SECURITY DEFINER) can insert.
-- The trigger runs as the function owner (superuser), so RLS is bypassed — no change needed.
-- But add a policy so customers can SELECT their own profile after login:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Customers can view their own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Customers can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Done! Customer signup should now work correctly.
