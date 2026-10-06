import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { localDB } from '@/lib/localDb';
import {
  Zap,
  User,
  Wrench,
  ShieldCheck,
  RotateCcw,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const QuickRoleSwitcher = () => {
  const { user, role, signIn, signInWithPhone, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitchToCustomer = async () => {
    setSwitching(true);
    await signIn('customer@nearmitra.com', 'customer123');
    toast.success('Switched to Customer: Pooja Verma');
    setSwitching(false);
    if (location.pathname.startsWith('/provider') || location.pathname.startsWith('/admin')) {
      navigate('/track');
    }
  };

  const handleSwitchToElectrician = async () => {
    setSwitching(true);
    await signInWithPhone('9876543210', 'provider123');
    toast.success('Switched to Provider: Ramesh Sharma (Electrician & AC)');
    setSwitching(false);
    navigate('/provider');
  };

  const handleSwitchToPlumber = async () => {
    setSwitching(true);
    await signInWithPhone('9876543211', 'provider123');
    toast.success('Switched to Provider: Suresh Patil (Plumber & Carpenter)');
    setSwitching(false);
    navigate('/provider');
  };

  const handleSwitchToAdmin = async () => {
    setSwitching(true);
    await signIn('admin@nearmitra.com', 'admin123');
    toast.success('Switched to Admin Portal');
    setSwitching(false);
    navigate('/admin');
  };

  const handleSignOut = async () => {
    setSwitching(true);
    await signOut();
    toast.info('Signed out. Viewing as Guest.');
    setSwitching(false);
    navigate('/');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all mock bookings, services, and accounts to initial default seed data?')) {
      localDB.resetToDefaults();
      toast.success('Local database reset to fresh default seed data!');
      window.location.reload();
    }
  };

  const getCurrentPersonaLabel = () => {
    if (!user) return 'Guest (Not logged in)';
    if (role === 'admin') return '👑 Admin Manager';
    if (role === 'provider') {
      const isSuresh = user.phone?.includes('43211') || user.email?.includes('43211');
      return isSuresh ? '🛠️ Suresh Patil (Plumber)' : '⚡ Ramesh Sharma (Electrician)';
    }
    return `👤 Customer (${user.user_metadata?.full_name || 'Pooja Verma'})`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="mb-2 w-80 max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-xl border-2 border-primary/30 rounded-2xl shadow-2xl p-4 animate-scale-in text-card-foreground">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-primary">Demo Role Switcher</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              title="Close"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Current Persona */}
          <div className="my-2.5 p-2 bg-secondary/60 rounded-xl text-xs flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Active:</span>
            <span className="font-bold text-foreground truncate max-w-[170px]">{getCurrentPersonaLabel()}</span>
          </div>

          {/* Switch Buttons */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">1-Click Switch To:</p>

            <button
              onClick={handleSwitchToCustomer}
              disabled={switching}
              className={`w-full text-left p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${role === 'customer'
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-background hover:bg-secondary border-border/70 text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Pooja Verma (Customer)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Book & Track</span>
            </button>

            <button
              onClick={handleSwitchToElectrician}
              disabled={switching}
              className={`w-full text-left p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${role === 'provider' && !user?.phone?.includes('43211')
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-background hover:bg-secondary border-border/70 text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Ramesh Sharma (Electrician)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Provider Portal</span>
            </button>

            <button
              onClick={handleSwitchToPlumber}
              disabled={switching}
              className={`w-full text-left p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${role === 'provider' && user?.phone?.includes('43211')
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-background hover:bg-secondary border-border/70 text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-teal-500" />
                <span>Suresh Patil (Plumber)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Provider Portal</span>
            </button>

            <button
              onClick={handleSwitchToAdmin}
              disabled={switching}
              className={`w-full text-left p-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${role === 'admin'
                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                : 'bg-background hover:bg-secondary border-border/70 text-foreground'
                }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                <span>Admin Manager</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Analytics</span>
            </button>
          </div>

          {/* Quick Page Links */}
          <div className="mt-3 pt-2.5 border-t border-border/60 grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => navigate('/book')}
              className="py-1 px-2 rounded-lg bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] text-left flex items-center justify-between"
            >
              <span>📅 Book Service</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => navigate('/track')}
              className="py-1 px-2 rounded-lg bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] text-left flex items-center justify-between"
            >
              <span>📦 Track Status</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => navigate('/provider')}
              className="py-1 px-2 rounded-lg bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] text-left flex items-center justify-between"
            >
              <span>🛠️ Provider View</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="py-1 px-2 rounded-lg bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] text-left flex items-center justify-between"
            >
              <span>📊 Admin View</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Utilities */}
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
            <button
              onClick={handleResetData}
              className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-[11px] font-medium transition-colors"
              title="Reset all mock database data to fresh default"
            >
              <RotateCcw className="w-3 h-3" /> Reset DB
            </button>
            {user && (
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] font-medium transition-colors"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-foreground text-background shadow-xl hover:shadow-2xl border-2 border-primary/40 hover:scale-105 active:scale-95 transition-all text-xs font-bold group"
      >
        <Sparkles className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '8s' }} />
        <span>Switcher</span>
        <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] uppercase font-mono">
          {role || 'Guest'}
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
