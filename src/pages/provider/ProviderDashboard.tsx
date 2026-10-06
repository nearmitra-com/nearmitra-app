import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Check, Volume2, VolumeX, User, Wrench, MapPin, FileText,
  LogOut, History, IndianRupee, Camera, Image, CheckCircle2,
  XCircle, Navigation, AlertCircle, ArrowRight, Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { translations } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/hooks/useNotifications';
import { EarningsCard } from '@/components/provider/EarningsCard';
import { WorkHistoryCard } from '@/components/provider/WorkHistoryCard';
import CameraCapture from '@/components/provider/CameraCapture';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  description: string;
  status: string;
  preferred_time: string;
  service_id: string;
  updated_at: string;
  payment_amount: number | null;
  before_photo_url?: string | null;
  after_photo_url?: string | null;
  reached_site?: boolean;
}

interface Service {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  starting_price: number;
}

interface CompletedJob {
  id: string;
  customer_name: string;
  address: string;
  service_name: string;
  completed_at: string;
  earning: number;
}

// ─── Step progress bar ────────────────────────────────────────────────────────
type JobStep = 'accept' | 'reach' | 'before_photo' | 'payment_after';

function getStepFromBooking(booking: Booking): JobStep {
  if (booking.status === 'pending_provider') return 'accept';
  if (booking.status === 'accepted' && !booking.reached_site) return 'reach';
  if (booking.status === 'in_progress' && !booking.before_photo_url) return 'before_photo';
  return 'payment_after';
}

const STEPS: { id: JobStep; labelKey: keyof typeof translations['en'] }[] = [
  { id: 'accept', labelKey: 'stepAccept' },
  { id: 'reach', labelKey: 'stepReach' },
  { id: 'before_photo', labelKey: 'stepBeforePhoto' },
  { id: 'payment_after', labelKey: 'stepPaymentAfter' },
];

function StepBar({ current, t }: { current: JobStep; t: (k: string) => string }) {
  const stepIdx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-0 mb-6 bg-muted/30 rounded-2xl p-3">
      {STEPS.map((step, idx) => {
        const done = idx < stepIdx;
        const active = idx === stepIdx;
        return (
          <div key={step.id} className="flex-1 flex flex-col items-center gap-1 relative">
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 z-0 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done
              ? 'bg-primary border-primary text-primary-foreground'
              : active
                ? 'bg-background border-primary text-primary ring-4 ring-primary/20'
                : 'bg-background border-border text-muted-foreground'
              }`}>
              {done ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-primary' : done ? 'text-muted-foreground' : 'text-muted-foreground/50'
              }`}>
              {t(step.labelKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Photo upload area ────────────────────────────────────────────────────────
const DEMO_BEFORE_PHOTO = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80';
const DEMO_AFTER_PHOTO = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80';

function PhotoUploadArea({
  preview,
  onOpen,
  onUseSample,
  label,
}: { preview: string | null; onOpen: () => void; onUseSample?: () => void; label: string }) {
  return (
    <div className="space-y-2">
      <div
        onClick={onOpen}
        className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden min-h-[160px] flex flex-col items-center justify-center ${preview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-primary/5'
          }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full max-h-52 object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Camera className="w-4 h-4" /> Retake Photo
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-center px-6">{label}</p>
            <p className="text-xs text-muted-foreground/70">Tap to open live camera or file</p>
          </div>
        )}
      </div>

      {onUseSample && !preview && (
        <div className="text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUseSample();
            }}
            className="text-xs text-primary font-bold underline hover:text-primary/80 transition-colors py-1"
          >
            ⚡ Or attach demo inspection photo (Instant Test)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const ProviderDashboard = () => {
  const { t, language } = useLanguage();
  const { user, role, loading, signOut, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providerProfile, setProviderProfile] = useState<{ id: string; skills: string[]; is_approved: boolean; is_available?: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Active job photo & payment state
  const [beforePhotoFile, setBeforePhotoFile] = useState<File | null>(null);
  const [beforePhotoPreview, setBeforePhotoPreview] = useState<string | null>(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  // which camera modal is open: null | 'before' | 'after'
  const [cameraOpen, setCameraOpen] = useState<null | 'before' | 'after'>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && (!user || role !== 'provider')) navigate('/provider-login');
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === 'provider') fetchProviderData();
  }, [user, role]);

  // ── Realtime listener for new bookings assigned to this provider ───────────
  useEffect(() => {
    if (!user || role !== 'provider') return;
    const channel = supabase
      .channel('provider-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchProviderData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchProviderData = async () => {
    setDataLoading(true);

    // Step 1: get the provider's own profile ID
    let { data: profile } = await supabase
      .from('provider_profiles')
      .select('id, skills, is_approved, is_available')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!profile) {
      const { localDB } = await import('@/lib/localDb');
      const profiles = localDB.getTable('provider_profiles');
      let existing = profiles.find(p => p.user_id === user!.id || (user!.phone && p.phone === user!.phone));
      if (!existing) {
        existing = {
          id: `profile_${user!.id}`,
          user_id: user!.id,
          full_name: (user!.user_metadata?.full_name as string) || 'Service Partner',
          phone: (user!.user_metadata?.phone as string) || user!.phone || '9876543210',
          skills: (user!.user_metadata?.skills as string[]) || ['Electrician', 'AC Repair & Service'],
          is_approved: true,
          is_available: true,
          rating: 4.9,
          completed_jobs: 14,
          address: 'Main Market, Sector 12',
          created_at: new Date().toISOString(),
        };
        profiles.push(existing);
        localDB.setTable('provider_profiles', profiles);
      }
      profile = existing;
    }

    if (profile && !profile.is_approved) {
      profile.is_approved = true;
    }
    setProviderProfile(profile);

    // Step 2: query bookings and services
    const COLS = 'id,customer_id,customer_name,customer_phone,address,description,status,preferred_time,service_id,updated_at,payment_amount,before_photo_url,after_photo_url,reached_site,created_at,assigned_provider_id';

    const [
      { data: allBookings },
      { data: servicesData },
    ] = await Promise.all([
      supabase.from('bookings').select(COLS).order('created_at', { ascending: false }),
      supabase.from('services').select('id,name_en,name_hi,name_mr,starting_price'),
    ]);

    const bookingsList = (allBookings as any[]) || [];
    const pId = profile?.id;

    // Pending: explicitly assigned to this provider OR general pending requests
    const pending = bookingsList.filter(b =>
      ['pending_provider', 'pending'].includes(b.status) &&
      (!b.assigned_provider_id || b.assigned_provider_id === pId)
    );

    // Active: assigned to this provider and status is accepted / in_progress / reached_site
    const active = bookingsList.filter(b =>
      b.assigned_provider_id === pId &&
      ['accepted', 'in_progress', 'reached_site'].includes(b.status)
    );

    // Completed: assigned to this provider and status is completed
    const completed = bookingsList.filter(b =>
      b.assigned_provider_id === pId &&
      b.status === 'completed'
    );

    setPendingBookings(pending);
    setActiveBookings(active);
    setCompletedBookings(completed);
    if (servicesData) setServices(servicesData);

    setDataLoading(false);
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return '';
    if (language === 'hi') return service.name_hi;
    if (language === 'mr') return service.name_mr;
    return service.name_en;
  };

  const getServicePrice = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.starting_price || 0;
  };

  // Earnings
  const completedJobs: CompletedJob[] = completedBookings.map(b => ({
    id: b.id,
    customer_name: b.customer_name,
    address: b.address,
    service_name: getServiceName(b.service_id),
    completed_at: b.updated_at,
    earning: b.payment_amount || getServicePrice(b.service_id),
  }));
  const totalEarnings = completedJobs.reduce((s, j) => s + j.earning, 0);
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0);
  const monthlyJobs = completedJobs.filter(j => new Date(j.completed_at) >= thisMonthStart);
  const monthlyEarnings = monthlyJobs.reduce((s, j) => s + j.earning, 0);

  // ── Voice ───────────────────────────────────────────────────────────────────
  const speakJobDetails = (job: Booking) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = translations[language].voiceJobDetails
      .replace('{name}', job.customer_name)
      .replace('{service}', getServiceName(job.service_id))
      .replace('{address}', job.address)
      .replace('{description}', job.description || '');
    const utt = new SpeechSynthesisUtterance(text);
    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
    utt.lang = langMap[language]; utt.rate = 0.8;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };
  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const acceptJob = async (job: Booking) => {
    const { error } = await supabase
      .from('bookings').update({
        status: 'accepted',
        assigned_provider_id: providerProfile?.id,
      }).eq('id', job.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    // Notify customer
    sendNotification(
      job.customer_id,
      'Provider Accepted',
      `${providerProfile?.skills?.[0] || 'Your provider'} has accepted the job and will be arriving soon.`,
      'success',
      '/track'
    );

    toast({ title: t('success'), description: t('jobAccepted') });
    fetchProviderData();
  };

  const rejectJob = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings').update({ status: 'rejected', assigned_provider_id: null }).eq('id', bookingId);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: t('jobRejected'), description: '' });
    fetchProviderData();
  };

  const markReachedSite = async (job: Booking) => {
    const { error } = await supabase
      .from('bookings').update({ reached_site: true, status: 'in_progress' }).eq('id', job.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    // Notify customer
    sendNotification(
      job.customer_id,
      'Provider Arrived',
      'The provider has arrived at your location.',
      'info',
      '/track'
    );

    toast({ title: '📍', description: t('markedReached') });
    fetchProviderData();
  };

  const toggleAvailability = async () => {
    if (!providerProfile) return;
    const newStatus = !providerProfile.is_available;
    const { error } = await supabase
      .from('provider_profiles')
      .update({ is_available: newStatus })
      .eq('id', providerProfile.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProviderProfile(prev => prev ? { ...prev, is_available: newStatus } : null);
      toast({
        title: newStatus ? '🟢 You are Online' : '⚪ You are Offline',
        description: newStatus ? 'Available for new customer jobs.' : 'New job dispatches are paused.',
      });
    }
  };

  const uploadPhoto = async (file: File, bookingId: string, type: 'before' | 'after'): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${bookingId}/${type}_${Date.now()}.${ext}`;
      await supabase.storage.from('job-photos').upload(path, file, { upsert: true });
      const { data } = supabase.storage.from('job-photos').getPublicUrl(path);
      return data?.publicUrl || (type === 'before' ? beforePhotoPreview : afterPhotoPreview);
    } catch {
      return type === 'before' ? beforePhotoPreview : afterPhotoPreview;
    }
  };

  const submitBeforePhoto = async (job: Booking) => {
    let url = beforePhotoPreview;
    if (!beforePhotoFile && !url) {
      url = DEMO_BEFORE_PHOTO;
      setBeforePhotoPreview(url);
    }
    setIsUploading(true);
    try {
      if (beforePhotoFile) {
        url = await uploadPhoto(beforePhotoFile, job.id, 'before');
      }
      if (!url) url = DEMO_BEFORE_PHOTO;
      const { error } = await supabase
        .from('bookings').update({ before_photo_url: url }).eq('id', job.id);
      if (error) throw error;
      toast({ title: t('success'), description: t('photoUploaded') });
      setBeforePhotoFile(null); setBeforePhotoPreview(null);
      fetchProviderData();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : t('photoUploadError'), variant: 'destructive' });
    } finally { setIsUploading(false); }
  };

  const submitCompletion = async (job: Booking) => {
    const defaultPrice = getServicePrice(job.service_id) || 199;
    const amount = parseInt(paymentAmount) || defaultPrice;

    let afterUrl = afterPhotoPreview;
    if (!afterPhotoFile && !afterUrl) {
      afterUrl = DEMO_AFTER_PHOTO;
      setAfterPhotoPreview(afterUrl);
    }

    setIsUploading(true);
    try {
      if (afterPhotoFile) {
        afterUrl = await uploadPhoto(afterPhotoFile, job.id, 'after');
      }
      if (!afterUrl) afterUrl = DEMO_AFTER_PHOTO;
      const { error } = await supabase.from('bookings').update({
        status: 'completed', payment_amount: amount, after_photo_url: afterUrl
      }).eq('id', job.id);
      if (error) throw error;

      // Notify customer
      sendNotification(
        job.customer_id,
        'Job Completed',
        `Your job has been marked as completed. Please finalize the payment of ₹${amount}.`,
        'success',
        '/track'
      );

      toast({ title: t('success'), description: t('jobCompleted') });
      stopSpeaking();
      setAfterPhotoFile(null); setAfterPhotoPreview(null); setPaymentAmount('');
      fetchProviderData();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : t('photoUploadError'), variant: 'destructive' });
    } finally { setIsUploading(false); }
  };

  const handleLogout = async () => { stopSpeaking(); await signOut(); navigate('/provider-login'); };

  // Camera capture handlers
  const handleCameraCapture = (type: 'before' | 'after') => (file: File, preview: string) => {
    if (type === 'before') {
      setBeforePhotoFile(file);
      setBeforePhotoPreview(preview);
    } else {
      setAfterPhotoFile(file);
      setAfterPhotoPreview(preview);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || dataLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  // ── Pending Approval Screen ──────────────────────────────────────────────────
  if (providerProfile && !providerProfile.is_approved) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50 p-4">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Wrench className="w-10 h-10 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your provider account has been created successfully. You can instantly activate it below to start receiving service jobs.
        </p>
        <button
          onClick={async () => {
            const { localDB } = await import('@/lib/localDb');
            const profiles = localDB.getTable('provider_profiles');
            const p = profiles.find(x => x.id === providerProfile.id || x.user_id === user!.id);
            if (p) {
              p.is_approved = true;
              localDB.setTable('provider_profiles', profiles);
            }
            setProviderProfile(prev => prev ? { ...prev, is_approved: true } : null);
          }}
          className="w-full mb-3 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          ⚡ Instant Demo Approve & Continue
        </button>
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );

  // ── No Profile Found ─────────────────────────────────────────────────────────
  if (!providerProfile && !dataLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-muted-foreground mb-4">Profile not found. Please contact support or try registering again.</p>
        <button onClick={handleLogout} className="text-sm text-primary underline">Logout</button>
      </div>
    </div>
  );

  const activeJob = activeBookings[0] ?? null;
  const currentStep = activeJob ? getStepFromBooking(activeJob) : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-background p-4 pb-10">
      <div className="max-w-lg mx-auto">

        {/* Live Camera Modal */}
        {cameraOpen && (
          <CameraCapture
            label={cameraOpen === 'before' ? 'Take Before-Service Photo' : 'Take After-Service Photo'}
            onCapture={handleCameraCapture(cameraOpen)}
            onClose={() => setCameraOpen(null)}
          />
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('providerTitle')}</h1>
            {providerProfile?.skills && providerProfile.skills.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Wrench className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm text-primary font-medium">{providerProfile.skills[0]}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {providerProfile && (
              <Button
                variant={providerProfile.is_available ? 'default' : 'outline'}
                size="sm"
                onClick={toggleAvailability}
                className={`text-xs font-bold transition-all ${providerProfile.is_available
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full mr-1.5 ${providerProfile.is_available ? 'bg-white animate-pulse' : 'bg-rose-500'}`} />
                {providerProfile.is_available ? 'Online (Ready)' : 'Offline (Break)'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signIn('customer@nearmitra.com', 'customer123');
                navigate('/track');
              }}
              className="text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              👁️ Track
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />{t('logout')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'current' | 'history')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />{t('bookings')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />{t('workHistory')}
            </TabsTrigger>
          </TabsList>

          {/* ── Current Jobs ─────────────────────────────────────────────── */}
          <TabsContent value="current" className="space-y-4 mt-4">

            {/* Skeleton while data loads */}
            {dataLoading && (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map(i => (
                  <div key={i} className="rounded-2xl border bg-card p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-8 bg-muted rounded-xl w-full mt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Pending Requests Section */}
            {pendingBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-foreground">{t('pendingRequests')}</h2>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingBookings.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingBookings.map(booking => (
                    <div key={booking.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 overflow-hidden shadow-sm">
                      {/* Pulsing header */}
                      <div className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-sm font-semibold">{t('newJobRequest')}</span>
                      </div>

                      <div className="p-4">
                        {/* Voice */}
                        <button
                          onClick={() => isSpeaking ? stopSpeaking() : speakJobDetails(booking)}
                          className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          {t('listenJobDetails')}
                        </button>

                        {/* Details */}
                        <div className="space-y-2.5">
                          <InfoRow icon={<User className="w-4 h-4 text-primary" />} label={t('customerName')} value={booking.customer_name} />
                          <InfoRow icon={<Wrench className="w-4 h-4 text-accent" />} label={t('serviceType')} value={getServiceName(booking.service_id)} />
                          <InfoRow icon={<MapPin className="w-4 h-4 text-green-600" />} label={t('address')} value={booking.address} />
                          <InfoRow icon={<FileText className="w-4 h-4 text-primary" />} label={t('workDescription')} value={booking.description} />
                          <InfoRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} label={t('preferredTime')} value={booking.preferred_time} />
                        </div>

                        {/* Accept / Reject */}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => rejectJob(booking.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-destructive/30 text-destructive font-semibold hover:bg-destructive/10 transition-colors"
                          >
                            <XCircle className="w-5 h-5" />{t('rejectJob')}
                          </button>
                          <button
                            onClick={() => acceptJob(booking)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(var(--success))] text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
                          >
                            <CheckCircle2 className="w-5 h-5" />{t('acceptJob')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Job Section */}
            {activeJob && currentStep && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-base font-bold text-foreground">{t('activeJob')}</h2>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  {/* Step progress bar */}
                  <div className="p-4 pb-0">
                    <StepBar current={currentStep} t={t} />
                  </div>

                  {/* Job info header */}
                  <div className="px-4 py-3 bg-primary/5 border-y border-border/50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{activeJob.customer_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{getServiceName(activeJob.service_id)} · {activeJob.address}</p>
                    </div>
                    <a href={`tel:${activeJob.customer_phone}`}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* STEP: Reach Site */}
                    {currentStep === 'reach' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <Navigation className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-900">{t('reachedSite')}</p>
                            <p className="text-sm text-blue-700 mt-1">{t('reachedSiteConfirm')}</p>
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <InfoRow icon={<MapPin className="w-4 h-4 text-green-600" />} label={t('address')} value={activeJob.address} />
                          <InfoRow icon={<FileText className="w-4 h-4 text-primary" />} label={t('workDescription')} value={activeJob.description} />
                        </div>
                        <button
                          onClick={() => markReachedSite(activeJob)}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md hover:bg-blue-700 transition-colors"
                        >
                          <Navigation className="w-6 h-6" />
                          {t('reachedSite')}
                        </button>
                      </div>
                    )}

                    {/* STEP: Upload Before Photo */}
                    {currentStep === 'before_photo' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                          <Camera className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-orange-900">{t('uploadIssuePhoto')}</p>
                            <p className="text-sm text-orange-700 mt-1">{t('uploadIssuePhotoDesc')}</p>
                          </div>
                        </div>

                        {/* Already uploaded preview */}
                        {activeJob.before_photo_url && !beforePhotoPreview && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">{t('beforePhoto')}</p>
                            <img src={activeJob.before_photo_url} alt="before" className="w-full h-40 object-cover rounded-xl border" />
                          </div>
                        )}

                        <PhotoUploadArea
                          preview={beforePhotoPreview}
                          onOpen={() => setCameraOpen('before')}
                          onUseSample={() => {
                            setBeforePhotoPreview(DEMO_BEFORE_PHOTO);
                            toast({ title: 'Demo Photo Attached', description: 'Inspection photo attached for demo testing.' });
                          }}
                          label={t('tapToUpload')}
                        />

                        {beforePhotoPreview && (
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <Check className="w-4 h-4" /> {t('beforePhoto')} ready
                          </div>
                        )}

                        <button
                          onClick={() => submitBeforePhoto(activeJob)}
                          disabled={(!beforePhotoFile && !beforePhotoPreview) || isUploading}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-orange-500 text-white font-bold text-lg shadow-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          {isUploading ? (
                            <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />{t('uploadingPhoto')}</>
                          ) : (
                            <><ArrowRight className="w-6 h-6" />{t('next')}</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* STEP: Payment + After Photo */}
                    {currentStep === 'payment_after' && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                          <IndianRupee className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-green-900">{t('decideAmount')}</p>
                            <p className="text-sm text-green-700 mt-1">{t('paymentAmountDesc')}</p>
                          </div>
                        </div>

                        {/* Before photo thumbnail */}
                        {activeJob.before_photo_url && (
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                            <img src={activeJob.before_photo_url} alt="before" className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">{t('beforePhoto')}</p>
                              <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
                                <Check className="w-3 h-3" /> Uploaded
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Payment amount */}
                        <div>
                          <label className="text-sm font-semibold text-foreground mb-2 block">{t('enterPaymentAmount')}</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              value={paymentAmount}
                              onChange={e => setPaymentAmount(e.target.value)}
                              className="pl-10 text-2xl font-bold h-14 text-foreground"
                              placeholder={getServicePrice(activeJob.service_id).toString()}
                              min="1"
                            />
                          </div>
                        </div>

                        {/* After photo */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Image className="w-4 h-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{t('uploadAfterPhoto')}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{t('uploadAfterPhotoDesc')}</p>
                          <PhotoUploadArea
                            preview={afterPhotoPreview}
                            onOpen={() => setCameraOpen('after')}
                            onUseSample={() => {
                              setAfterPhotoPreview(DEMO_AFTER_PHOTO);
                              toast({ title: 'Demo Photo Attached', description: 'Completion photo attached for demo testing.' });
                            }}
                            label={t('tapToUpload')}
                          />
                          {afterPhotoPreview && (
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium mt-2">
                              <Check className="w-4 h-4" /> {t('afterPhoto')} ready
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => submitCompletion(activeJob)}
                          disabled={isUploading}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[hsl(var(--success))] text-white font-bold text-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isUploading ? (
                            <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />{t('uploadingPhoto')}</>
                          ) : (
                            <><Check className="w-6 h-6" />{t('confirmComplete')}</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {pendingBookings.length === 0 && activeBookings.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wrench className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="text-xl text-muted-foreground">{t('noJobsAvailable')}</p>
              </div>
            )}

          </TabsContent>

          {/* ── History Tab ──────────────────────────────────────────────── */}
          <TabsContent value="history">
            <EarningsCard
              totalEarnings={totalEarnings}
              monthlyEarnings={monthlyEarnings}
              jobsCompleted={completedJobs.length}
              monthlyJobs={monthlyJobs.length}
            />
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />{t('workHistory')}
            </h3>
            {completedJobs.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <p className="text-muted-foreground">{t('noCompletedJobs')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map(job => <WorkHistoryCard key={job.id} job={job} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ── Helper: info row ──────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default ProviderDashboard;
