-- FIX: Two-part fix
-- PART 1: Reset recently created providers to pending
-- PART 2: Ensure triggers never auto-approve

-- 1. Reset providers created in the last 7 days to pending approval
UPDATE public.provider_profiles
SET is_approved = false, approved_at = NULL, approved_by = NULL
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 2. Drop old conflicting triggers that might be auto-approving
DROP TRIGGER IF EXISTS confirm_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.confirm_email_before_insert() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;

-- 3. Update the AFTER INSERT trigger to ensure is_approved is always false
CREATE OR REPLACE FUNCTION public.create_provider_profile_after_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skills TEXT[];
BEGIN
  IF NEW.raw_user_meta_data->>'role' IS DISTINCT FROM 'provider' THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(NEW.raw_user_meta_data->'skills', '[]'::jsonb)
      )
    ) INTO v_skills;
  EXCEPTION WHEN OTHERS THEN
    v_skills := '{}';
  END;

  INSERT INTO public.provider_profiles (
    user_id, full_name, phone, skills, address,
    is_available, is_approved, created_at, updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(v_skills, '{}'),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    true,
    false,   -- NEVER auto-approve: admin must explicitly approve
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET is_approved = false  -- ensure even conflict case stays pending
  WHERE provider_profiles.is_approved = false; -- don't overwrite if already approved

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'provider')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Show final state
SELECT full_name, phone, is_approved, created_at
FROM public.provider_profiles
ORDER BY created_at DESC;
