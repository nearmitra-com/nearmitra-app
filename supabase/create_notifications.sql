-- NOTIFICATIONS SYSTEM
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'booking', 'approval')),
  is_read BOOLEAN DEFAULT false,
  link TEXT,  -- optional deep-link (e.g. '/track')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- 4. Users can mark their own notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- 6. Allow system/admin to insert notifications for any user (SECURITY DEFINER function)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- 7. Enable real-time replication
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 8. Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Done!
SELECT 'Notifications table created successfully' AS status;
