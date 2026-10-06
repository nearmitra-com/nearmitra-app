-- Add provider approval workflow
-- This allows admins to approve/reject new service providers

-- 1. Add is_approved column to provider_profiles
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 2. Add approved_at and approved_by columns for tracking
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 3. Update RLS policies to prevent unapproved providers from accessing provider portal
-- Drop existing provider policies
DROP POLICY IF EXISTS "Providers can view their own profile" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can update their own profile" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can insert their own profile" ON public.provider_profiles;

-- Recreate with approval check
CREATE POLICY "Providers can view their own profile"
ON public.provider_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Approved providers can update their own profile"
ON public.provider_profiles FOR UPDATE
USING (auth.uid() = user_id AND is_approved = true);

CREATE POLICY "Providers can insert their own profile"
ON public.provider_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Admin policies (unchanged, admins can see and manage all)
CREATE POLICY "Admins can manage all provider profiles"
ON public.provider_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update bookings RLS to only show approved providers
DROP POLICY IF EXISTS "Providers can view their assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update their assigned bookings" ON public.bookings;

CREATE POLICY "Approved providers can view their assigned bookings"
ON public.bookings FOR SELECT
USING (
    assigned_provider_id IN (
        SELECT id FROM public.provider_profiles 
        WHERE user_id = auth.uid() AND is_approved = true
    )
);

CREATE POLICY "Approved providers can update their assigned bookings"
ON public.bookings FOR UPDATE
USING (
    assigned_provider_id IN (
        SELECT id FROM public.provider_profiles 
        WHERE user_id = auth.uid() AND is_approved = true
    )
);

-- 6. Auto-approve existing providers (optional - comment out if you want to manually approve all)
UPDATE public.provider_profiles 
SET is_approved = true, approved_at = now()
WHERE is_approved IS NULL OR is_approved = false;
