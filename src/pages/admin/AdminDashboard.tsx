import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Wrench, Calendar, LogOut, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, UserCheck, Eye, History, Radio,
  LayoutDashboard, Activity, TrendingUp, IndianRupee, Search, RefreshCw, Copy, Check, RotateCcw,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/hooks/useNotifications';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProviderDetailsDialog } from '@/components/admin/ProviderDetailsDialog';

type Tab = 'overview' | 'bookings' | 'providers' | 'services' | 'history';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444', '#3b82f6'];

interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  description: string;
  status: string;
  preferred_time: string;
  created_at: string;
  service_id: string;
  assigned_provider_id: string | null;
  payment_amount: number | null;
}

interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  skills: string[];
  is_available: boolean;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: string;
  address: string;
  created_at?: string;
}

interface ProviderStats {
  totalAssigned: number;
  totalCompleted: number;
  earnings: number;
}

interface Service {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  icon: string;
  starting_price: number;
  is_active: boolean;
}

const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [isProviderDetailsOpen, setIsProviderDetailsOpen] = useState(false);
  const [newService, setNewService] = useState({
    name_en: '', name_hi: '', name_mr: '', icon: 'Wrench', starting_price: 199, is_active: true
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & Search states
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [providerSearch, setProviderSearch] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchProviders(); // Always load providers immediately on login
      fetchData();
    }
  }, [user, role, activeTab]);

  // ── Real-time subscriptions ─────────────────────────────────────────────
  useEffect(() => {
    if (!user || role !== 'admin') return;

    // Remove any old channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('admin-realtime')
      // Watch all booking changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        fetchData();
        setLastUpdate(new Date());
        const evt = payload.eventType;
        if (evt === 'INSERT') toast({ title: '📋 New Booking', description: 'A new booking has been received.' });
        if (evt === 'UPDATE') toast({ title: '🔄 Booking Updated', description: 'A booking status has changed.' });
      })
      // Watch provider profile changes (approvals, availability, new signups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, (payload) => {
        fetchProviders(); // Always refresh providers regardless of active tab
        fetchData();
        setLastUpdate(new Date());
        const evt = payload.eventType;
        if (evt === 'INSERT') toast({ title: '👤 New Provider', description: 'A new provider has registered and is pending approval.', variant: 'default' });
        if (evt === 'UPDATE') toast({ title: '👤 Provider Updated', description: 'A provider profile has changed.' });
      })
      // Watch service changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchData();
        setLastUpdate(new Date());
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  // Always fetches ALL providers regardless of active tab
  const fetchProviders = async () => {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('fetchProviders error:', error.message);
    if (data) setProviders(data);
  };

  const fetchData = async () => {
    if (activeTab === 'overview' || activeTab === 'bookings') {
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data) setBookings(data);
      // Providers already kept fresh by fetchProviders()
      const { data: servicesData } = await supabase.from('services').select('*');
      if (servicesData) setServices(servicesData);
      if (activeTab === 'overview') await fetchProviders();
    } else if (activeTab === 'providers' || activeTab === 'history') {
      await fetchProviders();
      // Also fetch all bookings for stats calculation
      const { data: allBookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (allBookings) setBookings(allBookings);
      // And services for earnings calculation
      const { data: allServices } = await supabase.from('services').select('*');
      if (allServices) setServices(allServices);
    } else if (activeTab === 'services') {
      const { data } = await supabase.from('services').select('*');
      if (data) setServices(data);
    }
  };

  const fetchProviderStats = async (provider: Provider) => {
    // Get bookings for this provider
    const providerBookings = bookings.filter(b => b.assigned_provider_id === provider.id);
    const completedBookings = providerBookings.filter(b => b.status === 'completed');

    // Calculate earnings based on service prices
    let earnings = 0;
    completedBookings.forEach(booking => {
      const service = services.find(s => s.id === booking.service_id);
      if (service) {
        earnings += service.starting_price;
      }
    });

    setProviderStats({
      totalAssigned: providerBookings.length,
      totalCompleted: completedBookings.length,
      earnings: earnings,
    });
  };

  const openProviderDetails = async (provider: Provider) => {
    setSelectedProvider(provider);
    await fetchProviderStats(provider);
    setIsProviderDetailsOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin-login');
  };

  const updateBookingStatus = async (booking: Booking, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', booking.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('statusUpdated') });
      
      // Notify customer
      sendNotification(
        booking.customer_id,
        'Booking Status Updated',
        `Your booking for ${getBookingServiceName(booking)} is now ${status}.`,
        status === 'cancelled' ? 'warning' : 'info',
        '/track'
      );
      
      fetchData();
    }
  };

  const assignProvider = async (booking: Booking, providerProfileId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ assigned_provider_id: providerProfileId, status: 'pending_provider' })
      .eq('id', booking.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('providerAssigned') });
      
      // Notify Customer
      const provider = providers.find(p => p.id === providerProfileId);
      sendNotification(
        booking.customer_id,
        'Provider Assigned',
        `${provider?.full_name || 'A provider'} has been assigned to your booking. Waiting for their confirmation.`,
        'success',
        '/track'
      );

      // Notify Provider
      if (provider?.user_id) {
        sendNotification(
          provider.user_id,
          'New Job Request',
          `You have been assigned a new job: ${getBookingServiceName(booking)}. Please review and accept.`,
          'booking',
          '/provider'
        );
      }
      
      fetchData();
    }
  };

  const addService = async () => {
    const { error } = await supabase.from('services').insert([newService]);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('serviceAdded') });
      setIsAddServiceOpen(false);
      setNewService({ name_en: '', name_hi: '', name_mr: '', icon: 'Wrench', starting_price: 199, is_active: true });
      fetchData();
    }
  };

  const toggleServiceActive = async (serviceId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('services')
      .update({ is_active: !isActive })
      .eq('id', serviceId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const approveProvider = async (providerId: string) => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('provider_profiles')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', providerId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('providerApproved') || 'Provider approved successfully' });
      fetchData();
    }
  };

  const rejectProvider = async (providerId: string) => {
    // First, unassign this provider from any bookings to satisfy the FK constraint
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ assigned_provider_id: null, status: 'pending' })
      .eq('assigned_provider_id', providerId);

    if (bookingError) {
      toast({ title: 'Error', description: bookingError.message, variant: 'destructive' });
      return;
    }

    // Now safely delete the provider record
    const { error } = await supabase
      .from('provider_profiles')
      .delete()
      .eq('id', providerId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('providerRejected') || 'Provider rejected' });
      fetchData();
    }
  };

  const toggleProviderAvailability = async (provider: Provider) => {
    const newStatus = !provider.is_available;
    const { error } = await supabase
      .from('provider_profiles')
      .update({ is_available: newStatus })
      .eq('id', provider.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: `Provider is now ${newStatus ? 'Available' : 'Unavailable'}` });
      fetchProviders();
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to remove this service?')) return;
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: 'Service removed successfully' });
      fetchData();
    }
  };

  const exportHistoryToCsv = () => {
    const completed = bookings.filter(b => b.status === 'completed');
    if (completed.length === 0) {
      toast({ title: 'No Data', description: 'No completed bookings available to export.' });
      return;
    }
    const headers = ['Booking ID', 'Customer Name', 'Customer Phone', 'Service', 'Provider', 'Address', 'Amount (INR)', 'Date'];
    const rows = completed.map(b => {
      const s = services.find(srv => srv.id === b.service_id);
      const p = providers.find(prv => prv.id === b.assigned_provider_id);
      const amt = b.payment_amount || (s ? s.starting_price : 0);
      return [
        b.id,
        `"${(b.customer_name || '').replace(/"/g, '""')}"`,
        `"${b.customer_phone || ''}"`,
        `"${(s ? getServiceName(s) : b.service_id || '').replace(/"/g, '""')}"`,
        `"${(p ? p.full_name : 'Unassigned').replace(/"/g, '""')}"`,
        `"${(b.address || '').replace(/"/g, '""')}"`,
        amt,
        `"${new Date(b.created_at).toLocaleDateString()}"`
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nearmitra_completed_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Complete', description: 'CSV file downloaded successfully.' });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({ title: 'Copied', description: `Booking ID #${id} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getServiceName = (service: Service) => {
    if (language === 'hi') return service.name_hi;
    if (language === 'mr') return service.name_mr;
    return service.name_en;
  };

  // Get providers that match the service type of a booking
  const getMatchingProviders = (booking: Booking) => {
    const service = services.find(s => s.id === booking.service_id);
    if (!service) return providers.filter(p => p.is_available);

    // Match providers whose skills include the service name (in any language)
    return providers.filter(p => {
      if (!p.is_available) return false;
      if (!p.skills || p.skills.length === 0) return false;

      // Check if any of the provider's skills match the service name
      return p.skills.some(skill =>
        skill.toLowerCase() === service.name_en.toLowerCase() ||
        skill.toLowerCase() === service.name_hi.toLowerCase() ||
        skill.toLowerCase() === service.name_mr.toLowerCase()
      );
    });
  };

  // Get service name for a booking
  const getBookingServiceName = (booking: Booking) => {
    const service = services.find(s => s.id === booking.service_id);
    if (!service) return t('unknownService');
    return getServiceName(service);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      pending_provider: 'bg-amber-100 text-amber-800 border border-amber-300',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      assigned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-700',
    };
    const statusLabels: Record<string, string> = {
      pending: t('pending'),
      pending_provider: t('pendingProvider'),
      accepted: t('accepted'),
      in_progress: t('inProgress'),
      assigned: t('assigned'),
      completed: t('completed'),
      cancelled: t('cancelled'),
      rejected: t('rejected'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const totalBookingsCount = bookings.length;
  const activeProvidersCount = providers.filter(p => p.is_approved && p.is_available).length;
  const pendingProvidersCount = providers.filter(p => !p.is_approved).length;
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => {
      const s = services.find(s => s.id === b.service_id);
      return sum + (b.payment_amount || (s ? s.starting_price : 0));
    }, 0);

  const bookingsByStatus = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusLabels: Record<string, string> = {
    pending: t('pending') || 'Pending',
    pending_provider: t('pendingProvider') || 'Pending Provider',
    accepted: t('accepted') || 'Accepted',
    in_progress: t('inProgress') || 'In Progress',
    assigned: t('assigned') || 'Assigned',
    completed: t('completed') || 'Completed',
    cancelled: t('cancelled') || 'Cancelled',
    rejected: t('rejected') || 'Rejected',
  };

  const pieData = Object.keys(bookingsByStatus).map(key => ({
    name: statusLabels[key] || key,
    value: bookingsByStatus[key]
  }));
  
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none">{t('adminPanel')}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                <Radio className="w-3 h-3 text-green-600 animate-pulse" /> Live
              </span>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-all">
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">{t('logout')}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-muted/30 px-4 py-3 border-b border-border overflow-x-auto">
        <div className="flex gap-2 p-1 bg-muted rounded-xl w-max shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'overview' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('overview') || 'Overview'}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'bookings' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
          >
            <Calendar className="w-4 h-4" />
            {t('bookings')}
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'providers' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
          >
            <Users className="w-4 h-4" />
            {t('providers')}
            {providers.filter(p => !p.is_approved).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none animate-pulse shadow-sm">
                {providers.filter(p => !p.is_approved).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'services' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
          >
            <Wrench className="w-4 h-4" />
            {t('services')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg ${activeTab === 'history' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
          >
            <History className="w-4 h-4" />
            {t('history')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 lg:max-w-7xl lg:mx-auto space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium leading-none text-muted-foreground">{t('totalBookings') || 'Total Bookings'}</p>
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{totalBookingsCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium leading-none text-muted-foreground">{t('activeProviders') || 'Active Providers'}</p>
                    <UserCheck className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{activeProvidersCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium leading-none text-muted-foreground">{t('pendingProviders') || 'Pending Approval'}</p>
                    <Users className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{pendingProvidersCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium leading-none text-muted-foreground">{t('totalEarnings') || 'Total Earnings'}</p>
                    <IndianRupee className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">₹{totalRevenue}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Charts */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    {t('bookingsByStatus') || 'Bookings by Status'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-4 flex justify-center items-center h-[280px]">
                  {bookings.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noDataAvailable') || 'No data available'}</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {t('recentActivity') || 'Recent Activity'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentBookings.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{t('noRecentBookings') || 'No recent bookings'}</p>
                  ) : (
                    <div className="space-y-4">
                      {recentBookings.map(b => (
                        <div key={b.id} className="flex justify-between items-center border-b border-border last:border-0 pb-3 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{b.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{getBookingServiceName(b)}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(b.status)}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(b.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-card p-3 rounded-2xl border border-border/60">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: `All (${bookings.length})` },
                  { key: 'pending', label: `Pending / Unassigned (${bookings.filter(b => ['pending', 'pending_provider', 'rejected'].includes(b.status)).length})` },
                  { key: 'in_progress', label: `In Progress (${bookings.filter(b => ['accepted', 'in_progress'].includes(b.status)).length})` },
                  { key: 'completed', label: `Completed (${bookings.filter(b => b.status === 'completed').length})` },
                  { key: 'cancelled', label: `Cancelled (${bookings.filter(b => b.status === 'cancelled').length})` },
                ].map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setBookingStatusFilter(chip.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      bookingStatusFilter === chip.key
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search customer, phone, ID..."
                  value={bookingSearch}
                  onChange={e => setBookingSearch(e.target.value)}
                  className="pl-8 text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {bookings.filter(b => {
              const matchesStatus = 
                bookingStatusFilter === 'all' ? true :
                bookingStatusFilter === 'pending' ? ['pending', 'pending_provider', 'rejected'].includes(b.status) :
                bookingStatusFilter === 'in_progress' ? ['accepted', 'in_progress'].includes(b.status) :
                bookingStatusFilter === 'completed' ? b.status === 'completed' :
                bookingStatusFilter === 'cancelled' ? b.status === 'cancelled' : true;

              const term = bookingSearch.toLowerCase().trim();
              if (!term) return matchesStatus;

              const matchesSearch = 
                b.customer_name.toLowerCase().includes(term) ||
                b.customer_phone.includes(term) ||
                b.address.toLowerCase().includes(term) ||
                b.id.toLowerCase().includes(term) ||
                getBookingServiceName(b).toLowerCase().includes(term);

              return matchesStatus && matchesSearch;
            }).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-center text-muted-foreground text-sm font-medium">No bookings match the selected filter or search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.filter(b => {
                  const matchesStatus = 
                    bookingStatusFilter === 'all' ? true :
                    bookingStatusFilter === 'pending' ? ['pending', 'pending_provider', 'rejected'].includes(b.status) :
                    bookingStatusFilter === 'in_progress' ? ['accepted', 'in_progress'].includes(b.status) :
                    bookingStatusFilter === 'completed' ? b.status === 'completed' :
                    bookingStatusFilter === 'cancelled' ? b.status === 'cancelled' : true;

                  const term = bookingSearch.toLowerCase().trim();
                  if (!term) return matchesStatus;

                  const matchesSearch = 
                    b.customer_name.toLowerCase().includes(term) ||
                    b.customer_phone.includes(term) ||
                    b.address.toLowerCase().includes(term) ||
                    b.id.toLowerCase().includes(term) ||
                    getBookingServiceName(b).toLowerCase().includes(term);

                  return matchesStatus && matchesSearch;
                }).map((booking) => {
                  const assignedProvider = providers.find(p => p.id === booking.assigned_provider_id);
                  const isWorking = ['accepted', 'in_progress'].includes(booking.status);

                  return (
                    <Card key={booking.id} className="hover:shadow-md transition-all bg-card/60 backdrop-blur-sm border-border/60 flex flex-col justify-between">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                #{booking.id}
                              </span>
                              <button
                                onClick={() => handleCopyId(booking.id)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                title="Copy ID"
                              >
                                {copiedId === booking.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <p className="font-bold text-foreground text-sm">{booking.customer_name}</p>
                            <a href={`tel:${booking.customer_phone}`} className="text-xs text-primary hover:underline block font-medium">
                              {booking.customer_phone}
                            </a>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-xs space-y-1">
                          <p className="font-semibold text-foreground">{getBookingServiceName(booking)}</p>
                          <p className="text-muted-foreground line-clamp-1">{booking.address}</p>
                          {booking.description && (
                            <p className="text-muted-foreground italic line-clamp-1">"{booking.description}"</p>
                          )}
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1 border-t border-border/30">
                            <Clock className="w-3 h-3" />
                            <span>{booking.preferred_time || 'Immediate'} • {new Date(booking.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>

                        {/* Current Assigned Provider Indicator */}
                        <div className="text-xs">
                          {assignedProvider ? (
                            <div className="flex items-center justify-between text-muted-foreground bg-blue-500/5 px-2.5 py-1.5 rounded-lg border border-blue-500/10">
                              <span>Provider: <strong className="text-foreground">{assignedProvider.full_name}</strong></span>
                              <span className="text-[10px] text-blue-600 font-bold">{assignedProvider.skills?.[0] || 'Technician'}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium">
                              ⚠️ No provider assigned yet
                            </div>
                          )}
                        </div>

                        {/* Actions for Active / Uncompleted Bookings */}
                        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                          <div className="pt-2 border-t border-border/40 space-y-2">
                            {/* Provider Assignment Dropdown */}
                            <div className="flex items-center gap-2">
                              <Select onValueChange={(value) => assignProvider(booking, value)}>
                                <SelectTrigger className="w-full text-xs h-8">
                                  <SelectValue placeholder={assignedProvider ? `Reassign Provider` : `Assign Provider`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {providers.filter(p => p.is_approved).length === 0 ? (
                                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                      No approved providers available
                                    </div>
                                  ) : (
                                    providers.filter(p => p.is_approved).map((provider) => (
                                      <SelectItem key={provider.id} value={provider.id} className="text-xs">
                                        {provider.full_name} ({provider.skills?.[0] || 'Pro'}) {provider.is_available ? '🟢' : '⚪'}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex gap-2 justify-end">
                              {isWorking && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 text-xs font-semibold"
                                  onClick={() => updateBookingStatus(booking, 'completed')}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Mark Completed
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2.5 text-xs font-semibold"
                                onClick={() => updateBookingStatus(booking, 'cancelled')}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Reopen Cancelled Booking */}
                        {booking.status === 'cancelled' && (
                          <div className="pt-2 border-t border-border/40 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
                              onClick={() => updateBookingStatus(booking, 'pending')}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Reopen Booking
                            </Button>
                          </div>
                        )}

                        {/* Completed Info */}
                        {booking.status === 'completed' && (
                          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-emerald-700 font-semibold bg-emerald-500/5 p-2 rounded-lg">
                            <span>Settled</span>
                            <span>₹{booking.payment_amount || 199}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-card p-3 rounded-2xl border border-border/60">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: `All (${providers.length})` },
                  { key: 'pending', label: `Pending Approval (${providers.filter(p => !p.is_approved).length})` },
                  { key: 'approved', label: `Approved (${providers.filter(p => p.is_approved).length})` },
                  { key: 'available', label: `Available Now (${providers.filter(p => p.is_approved && p.is_available).length})` },
                ].map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => setProviderFilter(chip.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      providerFilter === chip.key
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search provider, phone, skill..."
                  value={providerSearch}
                  onChange={e => setProviderSearch(e.target.value)}
                  className="pl-8 text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {providers.filter(p => {
              const matchesFilter =
                providerFilter === 'all' ? true :
                providerFilter === 'pending' ? !p.is_approved :
                providerFilter === 'approved' ? p.is_approved :
                providerFilter === 'available' ? p.is_approved && p.is_available : true;

              const term = providerSearch.toLowerCase().trim();
              if (!term) return matchesFilter;

              const matchesSearch =
                p.full_name.toLowerCase().includes(term) ||
                p.phone.includes(term) ||
                p.address.toLowerCase().includes(term) ||
                (p.skills && p.skills.some(s => s.toLowerCase().includes(term)));

              return matchesFilter && matchesSearch;
            }).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-center text-muted-foreground text-sm font-medium">No providers match the selected filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.filter(p => {
                  const matchesFilter =
                    providerFilter === 'all' ? true :
                    providerFilter === 'pending' ? !p.is_approved :
                    providerFilter === 'approved' ? p.is_approved :
                    providerFilter === 'available' ? p.is_approved && p.is_available : true;

                  const term = providerSearch.toLowerCase().trim();
                  if (!term) return matchesFilter;

                  const matchesSearch =
                    p.full_name.toLowerCase().includes(term) ||
                    p.phone.includes(term) ||
                    p.address.toLowerCase().includes(term) ||
                    (p.skills && p.skills.some(s => s.toLowerCase().includes(term)));

                  return matchesFilter && matchesSearch;
                }).map((provider) => (
                  <Card key={provider.id} className="hover:shadow-md transition-all bg-card/60 backdrop-blur-sm border-border/60 flex flex-col justify-between">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <p className="font-bold text-foreground text-sm truncate">{provider.full_name}</p>
                            {!provider.is_approved && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-300">
                                Pending Review
                              </span>
                            )}
                          </div>
                          <a href={`tel:${provider.phone}`} className="text-xs text-primary font-medium hover:underline block">
                            {provider.phone}
                          </a>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{provider.address}</p>
                        </div>

                        {/* Availability Toggle */}
                        {provider.is_approved && (
                          <button
                            onClick={() => toggleProviderAvailability(provider)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                              provider.is_available
                                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                            }`}
                            title="Click to toggle availability"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${provider.is_available ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`} />
                            {provider.is_available ? 'Available' : 'Unavailable'}
                          </button>
                        )}
                      </div>

                      {/* Skills */}
                      {provider.skills && provider.skills.length > 0 && (
                        <div className="flex gap-1 flex-wrap pt-1">
                          {provider.skills.map((skill) => (
                            <span key={skill} className="bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                        {!provider.is_approved ? (
                          <div className="flex items-center gap-2 w-full">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 flex-1 text-xs font-bold" 
                              onClick={() => approveProvider(provider.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve Partner
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 px-3 text-xs font-semibold" 
                              onClick={() => rejectProvider(provider.id)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 h-8"
                            onClick={() => openProviderDetails(provider)}
                          >
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            View Performance & Jobs
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <ProviderDetailsDialog
              provider={selectedProvider}
              stats={providerStats}
              open={isProviderDetailsOpen}
              onOpenChange={setIsProviderDetailsOpen}
            />
          </div>
        )}

        {activeTab === 'services' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-muted-foreground">{services.length} active service categories configured.</p>
              <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto shadow-sm gap-2 text-xs font-bold">
                    <Plus className="w-4 h-4" />
                    {t('addService')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('addService')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t('nameEnglish')}</label>
                      <Input
                        value={newService.name_en}
                        onChange={(e) => setNewService({ ...newService, name_en: e.target.value })}
                        placeholder="Service name in English"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('nameHindi')}</label>
                      <Input
                        value={newService.name_hi}
                        onChange={(e) => setNewService({ ...newService, name_hi: e.target.value })}
                        placeholder="सेवा का नाम हिंदी में"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('nameMarathi')}</label>
                      <Input
                        value={newService.name_mr}
                        onChange={(e) => setNewService({ ...newService, name_mr: e.target.value })}
                        placeholder="सेवेचे नाव मराठीत"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('startingPrice')}</label>
                      <Input
                        type="number"
                        value={newService.starting_price}
                        onChange={(e) => setNewService({ ...newService, starting_price: parseInt(e.target.value) })}
                        placeholder="199"
                      />
                    </div>
                    <Button onClick={addService} className="w-full">{t('addService')}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-all bg-card/60 backdrop-blur-sm border-border/60">
                  <CardContent className="p-4 flex justify-between items-center gap-2">
                    <div>
                      <p className="font-bold text-foreground text-sm">{getServiceName(service)}</p>
                      <p className="text-xs text-muted-foreground">₹{service.starting_price} {t('startingFrom')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={service.is_active ? 'default' : 'outline'}
                        className="text-xs h-7 px-2.5 font-semibold"
                        onClick={() => toggleServiceActive(service.id, service.is_active)}
                      >
                        {service.is_active ? t('active') : t('inactive')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteService(service.id)}
                        title="Remove service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header & Export controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
              <div className="flex-1 w-full sm:w-auto relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search completed jobs by customer, phone, locality, or service..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 pr-8 bg-background border-border/80 h-10 w-full rounded-xl text-sm"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={exportHistoryToCsv}
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 px-4 font-semibold flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            {/* Quick Metrics */}
            {(() => {
              const allCompleted = bookings.filter(b => b.status === 'completed');
              const totalRevenue = allCompleted.reduce((sum, b) => {
                const s = services.find(srv => srv.id === b.service_id);
                return sum + (b.payment_amount || (s ? s.starting_price : 0));
              }, 0);
              const avgTicket = allCompleted.length > 0 ? Math.round(totalRevenue / allCompleted.length) : 0;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Orders</p>
                    <p className="text-2xl font-black text-foreground mt-1">{allCompleted.length}</p>
                  </div>
                  <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Booking Value</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Order Value</p>
                    <p className="text-2xl font-black text-primary mt-1">₹{avgTicket.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            })()}

            {/* Completed Bookings List */}
            {(() => {
              const term = historySearch.toLowerCase().trim();
              const filteredCompleted = bookings
                .filter(b => b.status === 'completed')
                .filter(b => {
                  if (!term) return true;
                  const s = services.find(srv => srv.id === b.service_id);
                  const p = providers.find(prv => prv.id === b.assigned_provider_id);
                  const sName = s ? getServiceName(s).toLowerCase() : '';
                  const pName = p ? p.full_name.toLowerCase() : '';
                  return (
                    b.id.toLowerCase().includes(term) ||
                    b.customer_name.toLowerCase().includes(term) ||
                    (b.customer_phone || '').includes(term) ||
                    (b.address || '').toLowerCase().includes(term) ||
                    sName.includes(term) ||
                    pName.includes(term)
                  );
                })
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

              if (filteredCompleted.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 rounded-2xl border border-dashed border-border/60 text-center">
                    <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-foreground font-semibold text-base">
                      {historySearch ? 'No matching completed bookings found' : t('noCompletedBookings')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      {historySearch ? 'Try a different search query like phone number, service name, or locality.' : 'Completed bookings will automatically show up here with receipts and earnings.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredCompleted.map((booking) => {
                    const service = services.find(s => s.id === booking.service_id);
                    const provider = providers.find(p => p.id === booking.assigned_provider_id);
                    const amount = booking.payment_amount || (service ? service.starting_price : 0);

                    return (
                      <div
                        key={booking.id}
                        className="bg-card border border-border/70 hover:border-primary/40 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/50">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground text-base">{booking.customer_name}</span>
                            <button
                              onClick={() => handleCopyId(booking.id)}
                              className="text-xs font-mono font-bold bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
                              title="Copy Booking ID"
                            >
                              <span>#{booking.id}</span>
                              {copiedId === booking.id ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-50" />
                              )}
                            </button>
                            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full text-xs border border-emerald-500/20">
                              ✓ {t('completed')}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground block">Collected</span>
                              <span className="text-xl font-black text-primary">₹{amount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 text-xs">
                          <div>
                            <span className="text-muted-foreground block font-medium">Service</span>
                            <span className="font-semibold text-foreground">
                              {service ? getServiceName(service) : t('unknownService')}
                            </span>
                          </div>

                          <div>
                            <span className="text-muted-foreground block font-medium">Customer Contact</span>
                            <a
                              href={`tel:${booking.customer_phone}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {booking.customer_phone}
                            </a>
                          </div>

                          <div>
                            <span className="text-muted-foreground block font-medium">Fulfilled By</span>
                            <span className="font-semibold text-foreground">
                              {provider ? provider.full_name : 'Direct Service'}
                            </span>
                          </div>

                          <div>
                            <span className="text-muted-foreground block font-medium">Service Date</span>
                            <span className="font-semibold text-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {new Date(booking.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
                          <span className="truncate max-w-md">📍 {booking.address}</span>
                          {booking.description && (
                            <span className="truncate max-w-xs italic text-muted-foreground/80">
                              "{booking.description}"
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
