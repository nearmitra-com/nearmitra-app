import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, Info, CheckCircle, AlertTriangle, Calendar, UserCheck } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

const TYPE_CONFIG = {
  info:     { icon: Info,        color: 'text-blue-500',   bg: 'bg-blue-50' },
  success:  { icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-50' },
  warning:  { icon: AlertTriangle,color: 'text-amber-500', bg: 'bg-amber-50' },
  booking:  { icon: Calendar,    color: 'text-purple-500', bg: 'bg-purple-50' },
  approval: { icon: UserCheck,   color: 'text-primary',    bg: 'bg-primary/10' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="ml-2 p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} notification={n} onRead={markAsRead} onDelete={deleteNotification} onClose={() => setOpen(false)} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function NotificationItem({
  notification: n,
  onRead,
  onDelete,
  onClose,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    onClose();
  };

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors cursor-pointer hover:bg-secondary/50 ${!n.is_read ? 'bg-primary/5' : ''}`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold text-foreground leading-snug ${!n.is_read ? 'font-bold' : ''}`}>
            {n.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!n.is_read && (
              <button
                onClick={(e) => { e.stopPropagation(); onRead(n.id); }}
                className="p-0.5 rounded hover:bg-primary/10 transition-colors"
                title="Mark as read"
              >
                <Check className="w-3 h-3 text-primary" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
              className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
      </div>

      {/* Unread dot */}
      {!n.is_read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  );

  return n.link ? <Link to={n.link}>{content}</Link> : <>{content}</>;
}
