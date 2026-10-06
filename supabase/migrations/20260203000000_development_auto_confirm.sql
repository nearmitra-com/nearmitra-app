-- ============================================
-- PROVIDER SIGNUP FIX - DEVELOPMENT VERSION
-- ============================================
-- This migration auto-confirms emails (no email verification needed)
-- Use this for local development/testing

-- 1. Drop problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 2. Create a SAFE, non-recursive policy for login
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create the function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.app_role;
  v_skills text[];
BEGIN
  -- AUTO-CONFIRM EMAIL (Development only!)
  IF new.email_confirmed_at IS NULL THEN
    new.email_confirmed_at := now();
  END IF;
  
  -- Extract role from metadata
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (new.raw_user_meta_data->>'role')::public.app_role;
  ELSE 
    RETURN new; 
  END IF;

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If role is provider, insert into provider_profiles
  IF v_role = 'provider' THEN
    
    -- Handle skills array conversion safely
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
      v_skills,
      new.raw_user_meta_data->>'address',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger Definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Confirm any existing unconfirmed emails (for development)
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
