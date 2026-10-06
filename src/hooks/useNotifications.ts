import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'booking' | 'approval';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cast to any to bypass generated-type mismatch for the notifications table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Notifications fetch error:', error.message);
    } else if (data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // ── Real-time subscription ──────────────────────────────────────────────
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .subscribe((status) => {
        // If real-time fails to connect, fall back to polling every 10s
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Notifications real-time failed, falling back to polling.');
          if (!pollRef.current) {
            pollRef.current = setInterval(fetchNotifications, 10_000);
          }
        }
      });

    // ── Fallback polling (always on, every 15s) ─────────────────────────────
    // Guarantees inbox stays fresh even if the real-time subscription lags
    pollRef.current = setInterval(fetchNotifications, 15_000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await db
      .from('notifications')
      .delete()
      .eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, refetch: fetchNotifications };
};

// ── Helper: send a notification to any user ──────────────────────────────────
export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  link?: string,
) => {
  if (!userId) {
    console.warn('sendNotification: no userId provided, skipping.');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    link: link ?? null,
  });

  if (error) {
    console.error('sendNotification failed:', error.message, '| userId:', userId, '| title:', title);
  }
};
