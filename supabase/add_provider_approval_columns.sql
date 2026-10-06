-- Add provider approval columns to provider_profiles table
-- Run this script in your Supabase SQL Editor

-- 1. Add is_approved column to provider_profiles
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- 2. Add approved_at and approved_by columns for tracking
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 3. Auto-approve existing providers (optional - comment out if you want to manually approve all)
UPDATE public.provider_profiles 
SET is_approved = true, approved_at = now()
WHERE is_approved IS NULL OR is_approved = false;

-- 4. Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'provider_profiles'
ORDER BY ordinal_position;
