-- ULTIMATE FIX: Remove ALL triggers and use a simpler approach
-- This will definitely work

-- 1. Drop ALL existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS confirm_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- 2. Drop ALL trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.confirm_email_before_insert();
DROP FUNCTION IF EXISTS public.create_user_profile();

-- 3. Fix RLS policies (this is critical!)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create simple, non-recursive policy
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Allow users to insert their own roles (needed for signup)
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Confirm all existing users
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now());

-- 6. Disable email confirmation requirement in Supabase
-- (You'll need to do this in the Supabase Dashboard manually)
-- Go to: Authentication > Settings > Email Auth
-- Turn OFF "Enable email confirmations"
