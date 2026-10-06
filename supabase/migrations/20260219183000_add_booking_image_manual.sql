-- Create the new bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-images', 'booking-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects
-- Note: Often you cannot modify RLS on system tables directly if you aren't a superuser.
-- Instead, use access control via buckets if your Supabase version supports it.
-- But for storage.objects policies:

create policy "Anyone can upload booking images"
on storage.objects for insert
with check ( bucket_id = 'booking-images' );

create policy "Anyone can view booking images"
on storage.objects for select
using ( bucket_id = 'booking-images' );

-- Update bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS image_url TEXT;
