-- ============================================================
-- FIX NOTIFICATIONS — Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create notifications table (safe if already exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'booking', 'approval')),
  is_read    BOOLEAN DEFAULT false,
  link       TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications"    ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications"  ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications"     ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications"     ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert"             ON public.notifications;

-- 4. Recreate all policies cleanly

-- SELECT — users see only their own
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- UPDATE — users can mark their own as read
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE — users can delete their own
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- INSERT — allow ALL roles (anon, authenticated, service_role) to insert
-- This is needed because sendNotification() runs client-side as the
-- ACTING user (admin/provider), NOT as the recipient user.
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- 5. Enable FULL replica identity for real-time change tracking
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 6. Add the table to the Supabase real-time publication
-- (Required for postgres_changes subscriptions to work)
DO $$
BEGIN
  -- Only add if not already a member
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, is_read)
  WHERE is_read = false;

-- Done!
SELECT 'Notifications fixed successfully' AS status;
