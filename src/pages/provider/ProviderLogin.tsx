import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Lock, Eye, EyeOff, Phone, User, MapPin,
  Briefcase, ArrowRight, ArrowLeft, CheckCircle2, Loader2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Service { id: string; name_en: string; name_hi: string; name_mr: string; }

// ─── Remember-me helper ────────────────────────────────────────────────────────
const REMEMBER_KEY = 'provider_remember_me';
const markRemember = (val: boolean) => {
  if (!val) sessionStorage.setItem(REMEMBER_KEY, 'false');
  else sessionStorage.removeItem(REMEMBER_KEY);
};

// ─── OTP input – 6 individual digit boxes ─────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (i: number, char: string) => {
    const d = char.replace(/\D/g, '').slice(-1);
    const next = digits.map((old, idx) => (idx === i ? d : old)).join('');
    onChange(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => (idx === i ? '' : d)).join('');
      onChange(next);
      if (i > 0) refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
            ${d ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-gray-50 text-gray-700'}
            focus:border-primary focus:ring-2 focus:ring-primary/20`}
        />
      ))}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'login' | 'signup';
type SStep = 'details' | 'otp' | 'success';

// ─── Main Component ────────────────────────────────────────────────────────────
const ProviderLogin = () => {
  const { t, language } = useLanguage();
  const { signInWithPhone, signUpProviderWithPhone, verifyProviderOtp, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<SStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // OTP step
  const [otp, setOtp] = useState('');
  const [resendSecs, setResendSecs] = useState(0);
  const [whatsappLink, setWhatsappLink] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastOtp, setLastOtp] = useState<string>('');

  // Auth guard
  useEffect(() => {
    if (!loading && user && role === 'provider') navigate('/provider');
  }, [user, role, loading, navigate]);

  // Services
  useEffect(() => {
    supabase.from('services')
      .select('id,name_en,name_hi,name_mr')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setServices(data);
        } else {
          import('@/lib/localDb').then(({ INITIAL_SERVICES }) => setServices(INITIAL_SERVICES as any));
        }
      });
  }, []);

  const handleDemoLogin = async (demoPhone: string, demoPass: string) => {
    setLoginPhone(demoPhone);
    setLoginPass(demoPass);
    setIsLoading(true);
    markRemember(true);
    const { error } = await signInWithPhone(demoPhone, demoPass);
    if (error) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
      setIsLoading(false);
    } else {
      toast({ title: '✅ Welcome back!', description: 'Taking you to your dashboard…' });
      setTimeout(() => navigate('/provider'), 300);
    }
  };

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const timer = setInterval(() => setResendSecs(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendSecs]);

  const getServiceName = (s: Service) => {
    if (language === 'hi') return s.name_hi;
    if (language === 'mr') return s.name_mr;
    return s.name_en;
  };

  const validatePhone = (p: string) =>
    /^[6-9]\d{9}$/.test(p.replace(/\D/g, '').slice(-10));

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!validatePhone(loginPhone)) errs.loginPhone = 'Enter a valid 10-digit mobile number';
    if (!loginPass) errs.loginPass = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    markRemember(rememberMe);
    const { error } = await signInWithPhone(loginPhone, loginPass);
    if (error) {
      toast({ title: 'Login Failed', description: 'Phone number or password is incorrect.', variant: 'destructive' });
    } else {
      toast({ title: '✅ Welcome back!', description: 'Taking you to your dashboard…' });
      setTimeout(() => navigate('/provider'), 600);
    }
    setIsLoading(false);
  };

  // ── SIGNUP STEP 1 – Send OTP ───────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!validatePhone(phone)) errs.phone = 'Enter a valid 10-digit mobile number';
    if (!serviceType) errs.serviceType = 'Please select your service type';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirmPass) errs.confirmPass = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);

    const { error, otp: generatedOtp } = await signUpProviderWithPhone(
      phone, password, { full_name: fullName, phone, address, skills: [] }
    );
    if (error) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } else if (generatedOtp) {
      setLastOtp(generatedOtp);
      // Build WhatsApp deep link with the OTP pre-filled as the message
      const msg = encodeURIComponent(
        `🔐 NearMitra Provider OTP\n\nYour one-time code is:\n\n*${generatedOtp}*\n\nValid for 10 minutes.`
      );
      const link = `https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${msg}`;
      setWhatsappLink(link);
      setStep('otp');
      setResendSecs(60);
      setOtp('');
      toast({ title: '📲 OTP Generated!', description: `Code: ${generatedOtp}. Enter below to verify.` });
    }
    setIsLoading(false);
  };

  // ── SIGNUP STEP 2 – Verify OTP ─────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\D/g, '').length < 6) {
      setErrors({ otp: 'Please enter the complete 6-digit OTP' });
      return;
    }
    setErrors({});
    setIsLoading(true);

    const selectedService = services.find(s => s.id === serviceType);
    const { error } = await verifyProviderOtp(phone, otp, password, {
      full_name: fullName,
      phone,
      address,
      skills: selectedService ? [selectedService.name_en] : [],
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('expired') || msg.includes('invalid')) {
        toast({ title: 'Wrong OTP', description: 'The code is incorrect or has expired. Request a new one.', variant: 'destructive' });
        setErrors({ otp: 'Invalid or expired OTP' });
      } else {
        toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });
      }
    } else {
      setStep('success');
    }
    setIsLoading(false);
  };

  // ── Resend OTP via WhatsApp ─────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendSecs > 0) return;
    // Generate a fresh OTP
    const { error, otp: newOtp } = await signUpProviderWithPhone(
      phone, password, { full_name: fullName, phone, address, skills: [] }
    );
    if (!error && newOtp) {
      setLastOtp(newOtp);
      const msg = encodeURIComponent(
        `🔐 NearMitra Provider OTP\n\nYour new code is:\n\n*${newOtp}*\n\nValid for 10 minutes.`
      );
      const link = `https://wa.me/+91${phone.replace(/\D/g, '').slice(-10)}?text=${msg}`;
      setWhatsappLink(link);
      setResendSecs(60);
      setOtp('');
      toast({ title: '📲 New OTP Generated', description: `Code: ${newOtp}` });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  const headerTitle = () => {
    if (mode === 'login') return 'Provider Login';
    if (step === 'otp') return 'Verify Your Number';
    if (step === 'success') return 'All Set! 🎉';
    return 'Register as Provider';
  };

  const headerSub = () => {
    if (mode === 'login') return 'Sign in to view your assigned jobs';
    if (step === 'otp') return `Enter the OTP sent to +91 ${phone}`;
    if (step === 'success') return 'Your account is created and pending admin approval';
    return 'Join  NearMitra to start receiving jobs';
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {step === 'otp' ? <ShieldCheck className="w-8 h-8 text-white" /> :
                step === 'success' ? <CheckCircle2 className="w-8 h-8 text-white" /> :
                  <Wrench className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold mb-1">{headerTitle()}</h1>
            <p className="text-white/75 text-sm">{headerSub()}</p>
          </div>

          <div className="px-8 py-8">

            {/* ── Mode Tabs (only on details step) ── */}
            {step === 'details' && (
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                {(['login', 'signup'] as Mode[]).map(m => (
                  <button key={m} type="button"
                    onClick={() => { setMode(m); setErrors({}); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                      ${mode === m ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m === 'login' ? 'Login' : 'Register'}
                  </button>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════
                LOGIN FORM
            ════════════════════════════════════════ */}
            {mode === 'login' && step === 'details' && (
              <form onSubmit={handleLogin} className="space-y-5">
                {/* ── Quick Demo Provider Accounts ── */}
                <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Quick 1-Click Demo Provider Logins:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('9876543210', 'provider123')}
                      className="text-left p-2.5 bg-white dark:bg-card rounded-xl border border-border hover:border-primary text-xs transition-all shadow-sm group"
                    >
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">⚡ Ramesh Sharma</div>
                      <div className="text-[11px] text-muted-foreground">Electrician & AC (9876543210)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('9876543211', 'provider123')}
                      className="text-left p-2.5 bg-white dark:bg-card rounded-xl border border-border hover:border-primary text-xs transition-all shadow-sm group"
                    >
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">⚡ Suresh Patil</div>
                      <div className="text-[11px] text-muted-foreground">Plumber & Wood (9876543211)</div>
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400 text-sm font-medium select-none">
                      <Phone className="w-4 h-4" /> +91
                    </span>
                    <Input type="tel" value={loginPhone}
                      onChange={e => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210" className="pl-20 h-12 text-base tracking-wider" disabled={isLoading} />
                  </div>
                  {errors.loginPhone && <p className="text-xs text-destructive mt-1">{errors.loginPhone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type={showLoginPass ? 'text' : 'password'} value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      placeholder="Your password" className="pl-10 pr-10 h-12" disabled={isLoading} />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.loginPass && <p className="text-xs text-destructive mt-1">{errors.loginPass}</p>}
                </div>

                {/* Remember Me */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => setRememberMe(!rememberMe)}
                    className={`w-10 h-6 rounded-full transition-all relative flex-shrink-0 ${rememberMe ? 'bg-primary' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${rememberMe ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Remember me on this device</span>
                </label>

                <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
                    : <><ArrowRight className="w-4 h-4 mr-2" /> Login to Dashboard</>}
                </Button>
              </form>
            )}

            {/* ════════════════════════════════════════
                SIGNUP – STEP 1: Details + Send OTP
            ════════════════════════════════════════ */}
            {mode === 'signup' && step === 'details' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma" className="pl-10 h-11" disabled={isLoading} />
                  </div>
                  {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400 text-sm font-medium select-none">
                      <Phone className="w-4 h-4" /> +91
                    </span>
                    <Input type="tel" value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210" className="pl-20 h-11 tracking-wider" disabled={isLoading} />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Service</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                    <Select value={serviceType} onValueChange={setServiceType} disabled={isLoading}>
                      <SelectTrigger className="pl-10 h-11"><SelectValue placeholder="Select your service type" /></SelectTrigger>
                      <SelectContent>
                        {services.map(s => <SelectItem key={s.id} value={s.id}>{getServiceName(s)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.serviceType && <p className="text-xs text-destructive mt-1">{errors.serviceType}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Area / Address <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="Your area, city" className="pl-10 h-11" disabled={isLoading} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" className="pl-10 pr-10 h-11" disabled={isLoading} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                      placeholder="Re-enter password" className="pl-10 h-11" disabled={isLoading} />
                  </div>
                  {errors.confirmPass && <p className="text-xs text-destructive mt-1">{errors.confirmPass}</p>}
                </div>

                <Button type="submit" className="w-full h-12 text-base font-bold mt-2" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing OTP…</>
                    : <><Phone className="w-4 h-4 mr-2" /> Get OTP via WhatsApp</>}
                </Button>
              </form>
            )}

            {/* ════════════════════════════════════════
                SIGNUP – STEP 2: Enter OTP
            ════════════════════════════════════════ */}
            {mode === 'signup' && step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* WhatsApp banner */}
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      {/* WhatsApp icon */}
                      <svg viewBox="0 0 32 32" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1C7.73 1 1 7.73 1 16c0 2.67.67 5.18 1.87 7.37L1 31l7.88-2.06A14.94 14.94 0 0016 31C24.27 31 31 24.27 31 16S24.27 1 16 1zm7.75 21.41c-.34.96-1.99 1.84-2.74 1.95-.7.1-1.6.14-2.57-.17a23.4 23.4 0 01-2.31-.86c-4.07-1.76-6.73-5.86-6.93-6.13-.2-.27-1.65-2.2-1.65-4.2 0-2 1.06-2.98 1.44-3.39.37-.4.82-.5 1.09-.5l.78.01c.25.01.59-.09.93.71.34.82 1.18 2.84 1.28 3.04.1.21.18.45.04.71-.14.27-.21.43-.41.67-.2.24-.43.54-.62.72-.2.2-.42.41-.18.82.24.4 1.06 1.75 2.29 2.84 1.58 1.41 2.91 1.84 3.31 2.05.4.2.64.17.88-.1.24-.28 1.03-1.2 1.3-1.61.27-.4.54-.34.91-.2.38.14 2.37 1.12 2.77 1.32.4.2.67.3.77.47.1.18.1 1-.24 1.95z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 text-sm">OTP via WhatsApp to +91 {phone}</p>
                      <p className="text-xs text-green-600 mt-0.5">WhatsApp opened with your OTP code. Read it and enter below.
                      </p>
                    </div>
                  </div>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors">
                    <svg viewBox="0 0 32 32" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1C7.73 1 1 7.73 1 16c0 2.67.67 5.18 1.87 7.37L1 31l7.88-2.06A14.94 14.94 0 0016 31C24.27 31 31 24.27 31 16S24.27 1 16 1zm7.75 21.41c-.34.96-1.99 1.84-2.74 1.95-.7.1-1.6.14-2.57-.17a23.4 23.4 0 01-2.31-.86c-4.07-1.76-6.73-5.86-6.93-6.13-.2-.27-1.65-2.2-1.65-4.2 0-2 1.06-2.98 1.44-3.39.37-.4.82-.5 1.09-.5l.78.01c.25.01.59-.09.93.71.34.82 1.18 2.84 1.28 3.04.1.21.18.45.04.71-.14.27-.21.43-.41.67-.2.24-.43.54-.62.72-.2.2-.42.41-.18.82.24.4 1.06 1.75 2.29 2.84 1.58 1.41 2.91 1.84 3.31 2.05.4.2.64.17.88-.1.24-.28 1.03-1.2 1.3-1.61.27-.4.54-.34.91-.2.38.14 2.37 1.12 2.77 1.32.4.2.67.3.77.47.1.18.1 1-.24 1.95z" />
                    </svg>
                    Open WhatsApp to see your OTP
                  </a>
                </div>

                {/* Local / Instant OTP auto-fill banner */}
                {lastOtp && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block">Instant Generated OTP:</span>
                      <span className="text-lg font-bold tracking-widest text-amber-900 dark:text-amber-200">{lastOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOtp(lastOtp); setErrors({}); }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/90 transition-all shadow-sm"
                    >
                      ⚡ Auto-Fill OTP
                    </button>
                  </div>
                )}

                <OtpInput value={otp} onChange={setOtp} />
                {errors.otp && <p className="text-xs text-destructive text-center">{errors.otp}</p>}

                <p className="text-center text-sm text-gray-500">
                  Didn't get it?{' '}
                  {resendSecs > 0
                    ? <span className="font-semibold text-gray-400">Resend in {resendSecs}s</span>
                    : <button type="button" onClick={handleResend} className="font-semibold text-green-600 hover:underline">Resend via WhatsApp</button>}
                </p>

                <Button type="submit" className="w-full h-12 text-base font-bold"
                  disabled={isLoading || otp.replace(/\D/g, '').length < 6}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                    : <><ShieldCheck className="w-4 h-4 mr-2" /> Verify &amp; Create Account</>}
                </Button>

                <button type="button" onClick={() => { setStep('details'); setOtp(''); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Go back
                </button>
              </form>
            )}

            {/* ════════════════════════════════════════
                SIGNUP – STEP 3: Success
            ════════════════════════════════════════ */}
            {mode === 'signup' && step === 'success' && (
              <div className="text-center space-y-5 py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Phone Verified!</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Your provider account is created. An admin will review and approve your profile.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-1">⏳ Pending Approval</p>
                  <p className="text-xs text-amber-600">
                    From next time, log in using your mobile number and the password you just set — no OTP needed again.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    if (!user) {
                      await signInWithPhone(phone, password);
                    }
                    setIsLoading(false);
                    navigate('/provider');
                  }}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-bold"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Go to Dashboard
                </Button>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your mobile number is your login ID · No email required
        </p>
      </div>
    </div>
  );
};

export default ProviderLogin;
