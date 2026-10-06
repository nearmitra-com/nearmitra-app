import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Image, X, ArrowRight, Copy, Check, Calendar, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Service {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  starting_price: number;
}

const BookService = () => {
  const { t, language } = useLanguage();
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service') || '';
  const taskParam = searchParams.get('task') || searchParams.get('desc') || '';
  const addressParam = searchParams.get('address') || '';

  const { signIn } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceResolved, setServiceResolved] = useState(false);
  const [lockedService, setLockedService] = useState<Service | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string>('');
  const [createdServiceObj, setCreatedServiceObj] = useState<Service | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    address: addressParam,
    description: taskParam,
    time: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (role === 'provider') {
      // Providers are not allowed to book services — redirect to their dashboard
      navigate('/provider');
    }
  }, [role, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.user_metadata?.full_name || '',
        phone: prev.phone || user.user_metadata?.phone || '',
        address: prev.address || user.user_metadata?.address || addressParam || '',
      }));
    } else if (addressParam) {
      setFormData(prev => ({
        ...prev,
        address: prev.address || addressParam,
      }));
    }
  }, [user, addressParam]);

  useEffect(() => {
    const fetchServices = async () => {
      let dataList: Service[] = [];
      try {
        const { data } = await supabase
          .from('services')
          .select('id, name_en, name_hi, name_mr, starting_price')
          .eq('is_active', true);
        if (data && data.length > 0) {
          dataList = data as Service[];
        }
      } catch { /* ignore */ }

      if (!dataList || dataList.length === 0) {
        dataList = (await import('@/lib/localDb')).INITIAL_SERVICES as unknown as Service[];
      }

      setServices(dataList);

      if (serviceParam) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pNorm = normalize(serviceParam);
        const matched = dataList.find((s: any) =>
          s.id === serviceParam ||
          normalize(s.id) === pNorm ||
          normalize(s.name_en) === pNorm ||
          normalize(s.id).includes(pNorm) ||
          pNorm.includes(normalize(s.name_en)) ||
          (s.category && (normalize(s.category) === pNorm || pNorm.includes(normalize(s.category)))) ||
          (pNorm.includes('ac') && (s.id.toLowerCase().includes('ac') || s.name_en.toLowerCase().includes('ac'))) ||
          (pNorm.includes('elect') && (s.id.toLowerCase().includes('elect') || s.name_en.toLowerCase().includes('elect'))) ||
          (pNorm.includes('plumb') && (s.id.toLowerCase().includes('plumb') || s.name_en.toLowerCase().includes('plumb'))) ||
          (pNorm.includes('clean') && (s.id.toLowerCase().includes('clean') || s.name_en.toLowerCase().includes('clean'))) ||
          (pNorm.includes('carp') && (s.id.toLowerCase().includes('carp') || s.name_en.toLowerCase().includes('carp'))) ||
          (pNorm.includes('paint') && (s.id.toLowerCase().includes('paint') || s.name_en.toLowerCase().includes('paint')))
        );
        if (matched) {
          setLockedService(matched);
          setFormData(prev => ({ ...prev, service: matched.id }));
        }
      }
      setServiceResolved(true);
    };
    fetchServices();
  }, [serviceParam]);

  const getServiceName = (service: Service) => {
    switch (language) {
      case 'hi': return service.name_hi;
      case 'mr': return service.name_mr;
      default: return service.name_en;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.phone || !formData.service || !formData.address) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);

    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('booking-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload image. Please try again.');
        setIsLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('booking-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    // Match provider for this service category
    const { localDB } = await import('@/lib/localDb');
    const allProfiles = localDB.getTable('provider_profiles');
    const selectedServiceObj = services.find(s => s.id === formData.service);
    const serviceName = selectedServiceObj?.name_en || '';

    let matchedProvider = allProfiles.find(p =>
      p.is_available && p.skills.some(skill =>
        serviceName.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(serviceName.toLowerCase())
      )
    );
    if (!matchedProvider && allProfiles.length > 0) {
      matchedProvider = allProfiles[0];
    }

    const customerId = user?.id || 'customer-demo-1';
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

    const { error: insertError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        customer_id: customerId,
        customer_name: formData.name,
        customer_phone: formData.phone,
        service_id: formData.service,
        address: formData.address,
        description: formData.description || null,
        preferred_time: formData.time || 'Earliest Available (30-45m)',
        status: 'pending_provider',
        assigned_provider_id: matchedProvider ? matchedProvider.id : null,
        image_url: imageUrl,
      });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setCreatedBookingId(bookingId);
    setCreatedServiceObj(selectedServiceObj || null);

    try {
      localStorage.setItem('nearmitra_last_booking_id', bookingId);
      localStorage.setItem('nearmitra_last_phone', formData.phone);
    } catch {
      // ignore storage error
    }

    // Notify customer
    import('@/hooks/useNotifications').then(({ sendNotification }) => {
      sendNotification(
        customerId,
        'Booking Received',
        `Your booking for ${serviceName || 'a service'} (#${bookingId}) has been successfully submitted!`,
        'success',
        `/track?phone=${encodeURIComponent(formData.phone)}`
      );
    });

    // Notify provider if assigned
    if (matchedProvider) {
      const notifs = localDB.getTable('notifications');
      notifs.push({
        id: `notif_${Date.now()}`,
        user_id: matchedProvider.user_id,
        title: 'New Booking Assigned',
        message: `New booking for ${serviceName} from ${formData.name}.`,
        type: 'booking',
        link: '/provider',
        is_read: false,
        created_at: new Date().toISOString(),
      });
      localDB.setTable('notifications', notifs);
    }

    setSubmitted(true);
    setIsLoading(false);
  };

  const copyBookingId = () => {
    if (createdBookingId) {
      navigator.clipboard.writeText(createdBookingId);
      setCopiedId(true);
      toast.success('Booking ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (submitted) {
    return (
      <div className="pb-24 md:pb-0 bg-secondary/30 min-h-screen">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-lg mx-auto bg-card border border-border/70 rounded-3xl p-6 sm:p-8 shadow-xl text-center animate-scale-in">
            <div className="w-16 h-16 bg-[hsl(152,69%,40%)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[hsl(152,69%,40%)]" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground mb-1">
              {t('bookingSuccess')}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mb-6">
              Our verified technician is being assigned and will arrive on time.
            </p>

            {/* Booking Reference Pill */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 text-left flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Booking Reference ID</span>
                <span className="text-lg font-black text-primary tracking-wide">#{createdBookingId}</span>
              </div>
              <button
                onClick={copyBookingId}
                className="bg-card hover:bg-muted text-foreground border border-border px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>

            {/* Summary details card */}
            <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-bold text-foreground">{createdServiceObj?.name_en || 'Home Service'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground">Estimated Inspection Fee:</span>
                <span className="font-bold text-foreground">₹{createdServiceObj?.starting_price || 199} (Pay after service)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground">Preferred Time:</span>
                <span className="font-bold text-foreground">{formData.time || 'Earliest Available (30-45m)'}</span>
              </div>
              <div className="flex justify-between items-start py-1">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-semibold text-foreground text-right max-w-[200px] truncate">{formData.address}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 justify-center">
              <Link
                to={`/track?phone=${encodeURIComponent(formData.phone)}`}
                className="btn-primary inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-md"
              >
                <span>📦 Track Live Status & Provider</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={async () => {
                  const { localDB } = await import('@/lib/localDb');
                  const users = localDB.getTable('users');
                  const pUser = users.find(u => u.phone === '9876543210');
                  if (pUser) {
                    await supabase.auth.signInWithPassword({ email: pUser.email, password: 'provider123' });
                  }
                  navigate('/provider');
                }}
                className="inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/40 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-white transition-all text-xs"
              >
                <span>⚡ Test as Provider (Accept This Job)</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      phone: '',
                      service: '',
                      address: '',
                      description: '',
                      time: '',
                    });
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Book Another Service
                </button>
                <Link
                  to="/"
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center justify-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-10 md:py-14 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Quick & Easy
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('bookServiceTitle')}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{t('bookServiceSubtitle') || "Fill in the details below to schedule your service."}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            <div className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t('yourName')} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t('phoneNumber')} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                {!user && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span>Booking as Guest. You can track this booking right after booking.</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await signIn('customer@nearmitra.com', 'customer123');
                      }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-xs shrink-0 shadow-sm"
                    >
                      ⚡ Quick Login (Pooja Verma)
                    </button>
                  </div>
                )}

                {/* Service Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      {t('selectService')} <span className="text-destructive">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{services.length} services available</span>
                  </div>

                  {lockedService ? (
                    /* ── Pre-selected service badge ─────────────────────── */
                    <div className="flex items-center justify-between px-4 py-3.5 rounded-xl border-2 border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{getServiceName(lockedService)}</p>
                          <p className="text-xs text-muted-foreground">Starting from ₹{lockedService.starting_price}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setLockedService(null); setFormData(prev => ({ ...prev, service: '' })); }}
                        className="text-xs text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        Change Service
                      </button>
                    </div>
                  ) : (
                    /* ── Normal dropdown & quick pills ──────────────────── */
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          name="service"
                          value={formData.service}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, service: val }));
                            const matched = services.find(s => s.id === val);
                            if (matched) setLockedService(matched);
                            setError('');
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm cursor-pointer"
                        >
                          <option value="">{t('selectService')}</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {getServiceName(service)} - ₹{service.starting_price}+
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>

                      {/* Quick select pills */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {services.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, service: s.id }));
                              setLockedService(s);
                              setError('');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formData.service === s.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                              }`}
                          >
                            {getServiceName(s)} (₹{s.starting_price})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('yourAddress')} <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[100px] resize-none text-sm"
                    placeholder="Flat No, Building, Street, Area, City..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Preferred Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t('preferredTime')}
                    </label>
                    <div className="relative">
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none text-sm"
                      >
                        <option value="">Any Time</option>
                        <option value="morning">{t('morning')}</option>
                        <option value="afternoon">{t('afternoon')}</option>
                        <option value="evening">{t('evening')}</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    </div>
                  </div>
                  {/* Problem Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t('problemDescription')} <span className="text-muted-foreground text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      placeholder="Briefly describe the issue..."
                    />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Upload Photo <span className="text-muted-foreground text-xs">(Optional)</span>
                  </label>

                  {!imagePreview ? (
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300"
                      >
                        <div className="p-3 bg-secondary rounded-xl group-hover:bg-primary/10 transition-colors duration-300">
                          <Image className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm text-muted-foreground mt-2 font-medium">Click to upload image</span>
                        <span className="text-xs text-muted-foreground/60 mt-1">Max 5MB</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-border group shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2.5 bg-white text-destructive rounded-xl hover:bg-destructive/5 transition-all duration-300 shadow-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 text-destructive text-sm bg-destructive/5 p-4 rounded-xl border border-destructive/10 animate-slide-down">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Price Note */}
                <div className="bg-primary/5 p-4 rounded-xl text-center border border-primary/10">
                  <p className="text-sm text-primary flex items-center justify-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('priceNote') || "Final price will be confirmed after inspection."}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full btn-primary text-lg font-semibold py-4 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    t('submitBooking') || "Book Service"
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  By booking, you agree to our{' '}
                  <Link to="/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                    Privacy Policy
                  </Link>.
                </p>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookService;
