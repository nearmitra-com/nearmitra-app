-- FIX: Remove Recursive RLS Policies on user_roles
-- The error "Database error querying schema" is caused by infinite recursion.
-- The policy "Admins can view all roles" calls has_role(), which queries user_roles, which triggers the policy again.

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 2. Create a SAFE, non-recursive policy for login
-- This allows users to read ONLY their own role, which is exactly what we need for login.
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 3. (Optional) Insert the provider user again just to be absolutely sure they exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'provider'
FROM auth.users
WHERE email = 'provider_saksham@ nearmitra.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.provider_profiles (user_id, full_name, phone, skills, address)
SELECT id, 'Saksham Provider', '9876543210', ARRAY['Electrician'], 'Mumbai'
FROM auth.users
WHERE email = 'provider_saksham@ nearmitra.com'
ON CONFLICT DO NOTHING;
