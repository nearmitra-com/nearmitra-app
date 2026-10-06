-- Migration to handle user signup via Triggers and Fix RLS
-- This fixes RLS issues where the user is not yet logged in during signup

-- 1. Drop problematic RLS policies that cause recursion
-- "Admins can view all roles" is recursive because it calls has_role() which queries user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 2. Create a SAFE, non-recursive policy for login
-- This allows users to read ONLY their own role using simple auth.uid() check
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
  -- Email confirmation will be handled by Supabase's native flow
  -- Users will receive a confirmation email and must click the link

  -- Extract role from metadata
  -- We assume metadata keys are: role, full_name, phone, address, skills
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (new.raw_user_meta_data->>'role')::public.app_role;
  ELSE 
    -- Default or fallback if needed, but for now we expect it
    RETURN new; 
  END IF;

  -- 4. Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5. If role is provider, insert into provider_profiles
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

-- 6. Trigger Definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
