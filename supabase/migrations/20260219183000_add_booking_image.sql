DO $$
BEGIN
    -- Add image_url to bookings table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='image_url') THEN
        ALTER TABLE public.bookings ADD COLUMN image_url TEXT;
    END IF;

    -- Create storage bucket for booking images if it doesn't exist
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('booking-images', 'booking-images', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS on objects (It might already be enabled, but this is idempotent-ish usually, but good to be safe)
-- Note: 'storage.objects' is owned by superuser/supabase_admin usually. As a normal user you might not benefit from ALTER TABLE on it directly if you aren't owner.
-- Check if RLS is enabled before trying to enable it to avoid errors if possible, or just ignore if it fails due to permissions if it is already enabled.
-- However, the error 'must be owner of table object' suggests we shouldn't try to ALTER it if we are not the owner.
-- storage.objects usually has RLS enabled by default in Supabase.

-- Policies
-- Drop existing policies to avoid conflicts or errors if they exist
DROP POLICY IF EXISTS "Anyone can upload booking images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view booking images" ON storage.objects;

-- Create policies
-- Note: We need to be careful about permissions. 
-- If the user running this is not a superuser/owner of storage.objects, they might not be able to create policies on it depending on the setup.
-- But usually, in Supabase dashboard SQL editor, you are a superuser (postgres).
-- If running via migration tool, it should also be high privilege.
-- The error "must be owner of table object" typically happens when trying to ALTER a table you don't own. 
-- 'storage.objects' is a system table. 

-- Let's try creating the policies without the ALTER TABLE line first, assuming RLS is already on.

CREATE POLICY "Anyone can upload booking images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'booking-images' );

CREATE POLICY "Anyone can view booking images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'booking-images' );
