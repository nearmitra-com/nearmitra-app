-- Migration: Add new booking statuses and reached_site column
-- Run this in the Supabase SQL Editor

-- 1. Add reached_site column to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reached_site BOOLEAN DEFAULT false;

-- 2. Drop the old CHECK constraint on status and replace it
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'pending_provider', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'));

-- 3. Also make sure before_photo_url and after_photo_url columns exist (from previous migration)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS after_photo_url  TEXT DEFAULT NULL;

-- 4. Create a storage bucket for job photos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS Policies (drop and re-create to avoid conflicts)
DROP POLICY IF EXISTS "Providers can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view job photos" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their job photos" ON storage.objects;

CREATE POLICY "Providers can upload job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');

CREATE POLICY "Anyone can view job photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

CREATE POLICY "Providers can update their job photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'job-photos');
