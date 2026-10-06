import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Loader2, Star, MapPin, Calendar, Clock, Phone,
    User, Wrench, CheckCircle2, Circle, Radio,
    Navigation, Camera, IndianRupee, AlertCircle,
    ArrowRight, Package, ChevronDown, ChevronUp,
    Search, MessageCircle, XCircle, RefreshCw,
    Share2, ShieldCheck, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProviderProfile {
    full_name: string;
    phone: string;
    skills: string[];
}

interface Booking {
    id: string;
    service_id: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    address: string;
    description: string | null;
    preferred_time: string | null;
    created_at: string;
    assigned_provider_id: string | null;
    payment_amount: number | null;
    reached_site: boolean | null;
    before_photo_url: string | null;
    after_photo_url: string | null;
    services: { name_en: string; name_hi: string; name_mr: string; starting_price?: number } | null;
    reviews?: { id: string; rating: number; comment: string }[];
    provider?: ProviderProfile | null;
}

// ─── Status timeline config ───────────────────────────────────────────────────
const STATUS_STEPS = [
    { key: 'pending', icon: Clock, label: 'Booking Received' },
    { key: 'pending_provider', icon: Radio, label: 'Finding Provider' },
    { key: 'accepted', icon: CheckCircle2, label: 'Provider Accepted' },
    { key: 'in_progress', icon: Navigation, label: 'Provider En Route' },
    { key: 'before_photo', icon: Camera, label: 'Work Started' },
    { key: 'payment_after', icon: IndianRupee, label: 'Payment & Verification' },
    { key: 'completed', icon: CheckCircle2, label: 'Completed' },
];

function getStepIndex(booking: Booking): number {
    const s = booking.status;
    if (s === 'completed') return 6;
    if (s === 'in_progress' && booking.before_photo_url) return 5;
    if (s === 'in_progress') return 4;
    if (s === 'accepted' && booking.reached_site) return 3;
    if (s === 'accepted') return 2;
    if (s === 'pending_provider') return 1;
    return 0; // pending
}

// ─── Vertical Timeline ───────────────────────────────────────────────────────
function StatusTimeline({ booking }: { booking: Booking }) {
    const currentIdx = getStepIndex(booking);
    const visibleSteps = STATUS_STEPS.filter((_, i) => i <= currentIdx + 1);

    return (
        <div className="relative pl-8 py-2">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border" />

            {visibleSteps.map((step, i) => {
                const done = i < currentIdx;
                const active = i === currentIdx;
                const Icon = step.icon;
                return (
                    <div key={step.key} className="relative flex items-center gap-4 pb-5 last:pb-0">
                        {/* Circle on line */}
                        <div className={`absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                            done ? 'bg-primary text-white shadow-md shadow-primary/30' :
                            active ? 'bg-white border-2 border-primary text-primary shadow-md ring-4 ring-primary/10' :
                            'bg-secondary text-muted-foreground border border-border'
                        }`}>
                            {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium ${active ? 'text-primary font-bold' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.label}
                            </span>
                            {active && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Current
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Provider Info Card ───────────────────────────────────────────────────────
function ProviderCard({ provider, status }: { provider: ProviderProfile; status: string }) {
    const isActive = !['pending', 'cancelled', 'completed', 'rejected'].includes(status);
    const cleanPhone = (provider.phone || '').replace(/[^0-9]/g, '').slice(-10);

    return (
        <div className={`rounded-2xl border p-4 ${isActive ? 'border-primary/20 bg-primary/5' : 'border-border bg-secondary/50'}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-gradient-to-br from-primary to-primary/80 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{provider.full_name}</p>
                    {provider.skills && provider.skills.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Wrench className="w-3 h-3 text-primary" />
                            <span className="text-xs text-primary font-medium">{provider.skills.slice(0, 2).join(', ')}</span>
                        </div>
                    )}
                </div>
                {isActive && (
                    <div className="flex items-center gap-1.5 text-xs text-[hsl(152,69%,40%)] font-semibold bg-[hsl(152,69%,40%)]/10 px-2.5 py-1 rounded-full border border-[hsl(152,69%,40%)]/20">
                        <span className="w-2 h-2 rounded-full bg-[hsl(152,69%,40%)] animate-pulse" />
                        On Job
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl btn-primary text-xs font-bold shadow-sm"
                >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {provider.full_name.split(' ')[0]}</span>
                </a>
                {cleanPhone && (
                    <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${provider.full_name}, I am contacting you regarding my NearMitra home service booking.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                        title="Chat on WhatsApp"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TrackBooking = () => {
    const { t, language } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Search query: check URL param ?phone=... or ?id=... or localStorage
    const urlPhone = searchParams.get('phone') || searchParams.get('id') || '';
    const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('nearmitra_last_phone') || '' : '';
    
    const [searchQuery, setSearchQuery] = useState(urlPhone || storedPhone || (user?.phone || ''));
    const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Review state
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // ── Fetch bookings (by search term OR user id) ───────────────────────────
    const fetchBookings = async (targetSearch?: string) => {
        setLoading(true);
        const queryTerm = (targetSearch !== undefined ? targetSearch : searchQuery).trim();
        const numOnly = queryTerm.replace(/[^0-9]/g, '');

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('bookings')
                .select(`
                    id, service_id, customer_id, customer_name, customer_phone, status, address,
                    description, preferred_time, created_at, assigned_provider_id,
                    payment_amount, reached_site, before_photo_url, after_photo_url,
                    services (name_en, name_hi, name_mr, starting_price),
                    reviews (id, rating, comment)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching bookings:', error);
                toast.error('Failed to fetch bookings');
                setLoading(false);
                return;
            }

            const raw = (data as any[]) || [];

            // Filter logic
            let matchedBookings = raw;

            if (queryTerm) {
                matchedBookings = raw.filter(b => {
                    const bPhone = (b.customer_phone || '').replace(/[^0-9]/g, '');
                    const bId = (b.id || '').toLowerCase();
                    const termLower = queryTerm.toLowerCase();

                    const matchesId = bId.includes(termLower);
                    const matchesPhone = numOnly.length >= 4 && bPhone.includes(numOnly);
                    const matchesCustomerId = b.customer_id === queryTerm;
                    const matchesName = (b.customer_name || '').toLowerCase().includes(termLower);

                    return matchesId || matchesPhone || matchesCustomerId || matchesName;
                });
            } else if (user) {
                matchedBookings = raw.filter(b => 
                    b.customer_id === user.id || 
                    (user.phone && (b.customer_phone || '').includes(user.phone))
                );
            }

            const enriched = await Promise.all(
                matchedBookings.map(async (b) => {
                    if (!b.assigned_provider_id) return { ...b, provider: null };
                    const { data: pData } = await supabase
                        .from('provider_profiles')
                        .select('full_name, phone, skills')
                        .eq('id', b.assigned_provider_id)
                        .maybeSingle();
                    return { ...b, provider: pData ?? null };
                })
            );

            setBookings(enriched as Booking[]);
            
            // Auto expand first active booking
            const firstActive = enriched.find(b => !['completed', 'cancelled', 'rejected'].includes(b.status));
            if (firstActive) {
                setExpandedId(firstActive.id);
            } else if (enriched.length > 0) {
                setExpandedId(enriched[0].id);
            }
        } catch (err) {
            console.error('Booking fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Handle search submit ──────────────────────────────────────────────────
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearchParams({ phone: searchQuery.trim() });
            try {
                localStorage.setItem('nearmitra_last_phone', searchQuery.trim());
            } catch { /* ignore */ }
        }
        fetchBookings(searchQuery.trim());
    };

    // ── Realtime subscription ────────────────────────────────────────────────
    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }
        const channel = supabase
            .channel('track-bookings-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                fetchBookings();
            })
            .subscribe();
        channelRef.current = channel;

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [searchQuery, user]);

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return;
        fetchBookings();
    }, [authLoading]);

    // ── Cancel Booking Handler ───────────────────────────────────────────────
    const handleCancelBooking = async (bookingId: string) => {
        const confirmed = window.confirm('Are you sure you want to cancel this booking? Free cancellation is guaranteed.');
        if (!confirmed) return;

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (error) {
            toast.error('Failed to cancel: ' + error.message);
        } else {
            toast.success('Booking has been cancelled.');
            fetchBookings();
        }
    };

    // ── Copy Booking ID ──────────────────────────────────────────────────────
    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedBookingId(id);
        toast.success(`Booking ID #${id} copied`);
        setTimeout(() => setCopiedBookingId(null), 2000);
    };

    // ── Review submission ────────────────────────────────────────────────────
    const submitReview = async (bookingId: string) => {
        if (rating === 0) { 
            toast.error(t('ratingRequired') || 'Please select a rating'); 
            return; 
        }
        setIsSubmittingReview(true);
        const { error } = await supabase.from('reviews').insert({ booking_id: bookingId, rating, comment });
        if (error) {
            toast.error('Failed to submit review');
        } else {
            toast.success(t('reviewSuccess') || 'Review submitted!');
            setSelectedBookingId(null);
            setRating(0);
            setComment('');
            fetchBookings();
        }
        setIsSubmittingReview(false);
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getServiceName = (service: Booking['services']) => {
        if (!service) return '';
        switch (language) {
            case 'hi': return service.name_hi;
            case 'mr': return service.name_mr;
            default: return service.name_en;
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { bg: string; text: string; label: string; dot: string }> = {
            completed: { bg: 'bg-[hsl(152,69%,40%)]/10', text: 'text-[hsl(152,69%,40%)]', label: 'Completed', dot: 'bg-[hsl(152,69%,40%)]' },
            in_progress: { bg: 'bg-primary/10', text: 'text-primary', label: 'In Progress', dot: 'bg-primary' },
            accepted: { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', label: 'Provider Assigned', dot: 'bg-blue-600' },
            pending_provider: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', label: 'Assigning Provider', dot: 'bg-amber-500' },
            pending: { bg: 'bg-yellow-50 text-yellow-800', text: 'text-yellow-800', label: 'Pending Confirmation', dot: 'bg-yellow-500' },
            cancelled: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Cancelled', dot: 'bg-destructive' },
            rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected', dot: 'bg-destructive' },
        };
        return configs[status] ?? configs.pending;
    };

    const activeBookings = bookings.filter(b => !['completed', 'cancelled', 'rejected'].includes(b.status));
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const cancelledBookings = bookings.filter(b => ['cancelled', 'rejected'].includes(b.status));

    const displayedBookings = 
        filterTab === 'active' ? activeBookings :
        filterTab === 'completed' ? completedBookings :
        filterTab === 'cancelled' ? cancelledBookings :
        bookings;

    return (
        <div className="pb-24 md:pb-0 bg-background min-h-screen">
            {/* Header with Search */}
            <div className="bg-foreground text-white py-10 md:py-14 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
                <div className="container mx-auto px-4 relative max-w-3xl">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wider mb-2">
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            Live Dispatch Radar
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">
                            Track Your Bookings
                        </h1>
                        <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto">
                            Enter your phone number or booking reference to view live technician status.
                        </p>
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
                        <div className="flex items-center bg-card rounded-2xl p-1.5 shadow-xl border border-white/20 focus-within:ring-2 focus-within:ring-primary">
                            <Search className="w-4 h-4 text-muted-foreground ml-3 mr-2 flex-shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter phone number (e.g. 9876543210) or BK-123456"
                                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm outline-none px-2 py-2"
                            />
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex-shrink-0 shadow-sm"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Quick Demo Pill */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-white/50">
                        <span>Quick Demo Lookup:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('9822012345');
                                fetchBookings('9822012345');
                            }}
                            className="text-white/80 hover:text-white underline decoration-dotted"
                        >
                            Pooja (9822012345)
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                fetchBookings('');
                            }}
                            className="text-white/80 hover:text-white underline decoration-dotted"
                        >
                            View All Recent
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="border-b border-border bg-card sticky top-16 z-20 shadow-xs">
                <div className="container mx-auto px-4 max-w-3xl flex items-center justify-between overflow-x-auto py-2.5 gap-2">
                    <div className="flex gap-1 sm:gap-2">
                        {[
                            { key: 'all', label: `All (${bookings.length})` },
                            { key: 'active', label: `Active (${activeBookings.length})` },
                            { key: 'completed', label: `Completed (${completedBookings.length})` },
                            { key: 'cancelled', label: `Cancelled (${cancelledBookings.length})` },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterTab(tab.key as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                                    filterTab === tab.key
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => fetchBookings()}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/60 hover:bg-muted flex-shrink-0"
                        title="Refresh status"
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/20 border-t-primary" />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Looking up booking records…</p>
                    </div>
                ) : displayedBookings.length === 0 ? (
                    <div className="text-center py-16 animate-fade-in-up bg-card rounded-3xl border border-border/60 p-8 shadow-xs">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-primary/60" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">No bookings found</h3>
                        <p className="text-muted-foreground text-xs sm:text-sm mb-6 max-w-sm mx-auto">
                            {searchQuery 
                                ? `No booking records match "${searchQuery}". Please check the phone number or try a different number.`
                                : "You haven't placed any service requests yet."}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                to="/book"
                                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md"
                            >
                                Book a Service Now <ArrowRight className="w-4 h-4" />
                            </Link>
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        fetchBookings('');
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayedBookings.map((booking) => {
                            const statusConf = getStatusConfig(booking.status);
                            const isExpanded = expandedId === booking.id;
                            const isPending = ['pending', 'pending_provider'].includes(booking.status);

                            return (
                                <div
                                    key={booking.id}
                                    className="bg-card rounded-3xl border border-border/70 shadow-xs hover:shadow-md transition-all overflow-hidden"
                                >
                                    {/* Accent Top Strip */}
                                    <div className={`h-1.5 w-full ${
                                        booking.status === 'completed' ? 'bg-emerald-500' :
                                        booking.status === 'cancelled' || booking.status === 'rejected' ? 'bg-rose-500' :
                                        'bg-primary'
                                    }`} />

                                    {/* Card Header Summary */}
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                        #{booking.id}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopyId(booking.id)}
                                                        className="text-[11px] text-muted-foreground hover:text-foreground"
                                                        title="Copy Reference"
                                                    >
                                                        {copiedBookingId === booking.id ? <Check className="w-3 h-3 text-emerald-600 inline" /> : 'copy'}
                                                    </button>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(booking.created_at), 'dd MMM yyyy, hh:mm a')}
                                                    </span>
                                                </div>

                                                <h3 className="text-base sm:text-lg font-bold text-foreground">
                                                    {getServiceName(booking.services) || 'Doorstep Service'}
                                                </h3>

                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{booking.customer_name}</span>
                                                    <span>({booking.customer_phone})</span>
                                                </p>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusConf.bg} ${statusConf.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot} animate-pulse`} />
                                                    {statusConf.label}
                                                </span>

                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                                                    className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
                                                >
                                                    <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick Progress Bar for active jobs */}
                                        {!['completed', 'cancelled', 'rejected'].includes(booking.status) && !isExpanded && (
                                            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 text-primary font-semibold">
                                                    <Navigation className="w-3.5 h-3.5 animate-bounce" />
                                                    <span>
                                                        {booking.status === 'pending_provider' ? 'Matching verified technician nearby...' :
                                                         booking.status === 'accepted' ? 'Technician assigned & preparing tools' :
                                                         'Technician on site / work in progress'}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground text-[11px]">
                                                    Tap details to inspect
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expandable Body */}
                                    {isExpanded && (
                                        <div className="px-5 pb-6 sm:px-6 space-y-5 border-t border-border/50 pt-4 bg-muted/20">
                                            {/* Address & Slot */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-card p-3.5 rounded-2xl border border-border/60">
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold text-foreground block">Service Location:</span>
                                                        <span className="text-muted-foreground">{booking.address}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <Clock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-semibold text-foreground block">Preferred Schedule:</span>
                                                        <span className="text-muted-foreground">{booking.preferred_time || 'Immediate Dispatch'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Problem Description */}
                                            {booking.description && (
                                                <div className="text-xs bg-card p-3.5 rounded-2xl border border-border/60">
                                                    <span className="font-semibold text-foreground block mb-1">Issue Description / Note:</span>
                                                    <p className="text-muted-foreground">{booking.description}</p>
                                                </div>
                                            )}

                                            {/* Timeline */}
                                            {!['cancelled', 'rejected'].includes(booking.status) && (
                                                <div className="bg-card rounded-2xl p-4 border border-border/60">
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                                                        <span>Live Service Journey</span>
                                                        <span className="text-[11px] font-normal text-muted-foreground">30-day warranty covered</span>
                                                    </p>
                                                    <StatusTimeline booking={booking} />
                                                </div>
                                            )}

                                            {/* Assigned Provider Info */}
                                            {booking.provider ? (
                                                <div>
                                                    <p className="text-xs font-bold text-foreground mb-2">Assigned Specialist</p>
                                                    <ProviderCard provider={booking.provider} status={booking.status} />
                                                </div>
                                            ) : isPending ? (
                                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-700 flex items-center gap-3">
                                                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-bold">Dispatching Nearest Specialist</p>
                                                        <p className="text-amber-600/80">We are alerting certified providers in your area. You will receive an SMS and WhatsApp confirmation shortly.</p>
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Photos (Before & After) */}
                                            {(booking.before_photo_url || booking.after_photo_url) && (
                                                <div className="bg-card p-4 rounded-2xl border border-border/60">
                                                    <p className="text-xs font-bold text-foreground mb-2">Job Photos & Inspection</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {booking.before_photo_url && (
                                                            <div>
                                                                <p className="text-[11px] font-medium text-muted-foreground mb-1">Before Service</p>
                                                                <img src={booking.before_photo_url} alt="Before work" className="w-full h-28 object-cover rounded-xl border border-border" />
                                                            </div>
                                                        )}
                                                        {booking.after_photo_url && (
                                                            <div>
                                                                <p className="text-[11px] font-medium text-muted-foreground mb-1">After Completion</p>
                                                                <img src={booking.after_photo_url} alt="After work" className="w-full h-28 object-cover rounded-xl border border-border" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pricing & Invoice Details */}
                                            {booking.status === 'completed' && (
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-2">
                                                    <div className="flex justify-between items-center font-bold text-foreground text-sm">
                                                        <span>Total Paid:</span>
                                                        <span className="text-emerald-700 text-base">₹{booking.payment_amount || booking.services?.starting_price || 199}</span>
                                                    </div>
                                                    <p className="text-muted-foreground text-[11px]">
                                                        Payment settled via cashless UPI / Cash post-satisfaction. Covered under NearMitra 30-Day Free Rework Guarantee.
                                                    </p>

                                                    {/* Review action */}
                                                    <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center">
                                                        <span className="font-semibold text-emerald-800">Job Complete</span>
                                                        <button
                                                            onClick={() => setSelectedBookingId(booking.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                                                        >
                                                            ⭐ Leave Review
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Review Form Modal/Drawer */}
                                            {selectedBookingId === booking.id && (
                                                <div className="bg-card p-4 rounded-2xl border border-primary/30 shadow-md space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-foreground">Rate Your Experience</span>
                                                        <button onClick={() => setSelectedBookingId(null)} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setRating(star)}
                                                                className="p-1 hover:scale-110 transition-transform"
                                                            >
                                                                <Star className={`w-5 h-5 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <textarea
                                                        value={comment}
                                                        onChange={(e) => setComment(e.target.value)}
                                                        placeholder="How was the service technician? Cleanliness, speed, behavior..."
                                                        className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                                        rows={2}
                                                    />

                                                    <button
                                                        onClick={() => submitReview(booking.id)}
                                                        disabled={isSubmittingReview}
                                                        className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                                                    >
                                                        {isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Action Bar (Cancel / Contact) */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href="tel:+919152106425"
                                                        className="text-muted-foreground hover:text-primary flex items-center gap-1 font-medium"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>24/7 Helpline (+91 91521 06425)</span>
                                                    </a>
                                                </div>

                                                {/* Cancel Button if unstarted */}
                                                {isPending && (
                                                    <button
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-xl font-semibold transition-colors flex items-center gap-1"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Cancel Booking</span>
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackBooking;
