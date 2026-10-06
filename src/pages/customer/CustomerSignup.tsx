
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, User, Phone, Shield, Star, Clock } from 'lucide-react';

const CustomerSignup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Password validation
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        if (!hasNumber || !hasSpecial) {
            toast.error("Password must contain at least one number and one special character.");
            return;
        }

        setLoading(true);
        const timeoutId = setTimeout(() => {
            setLoading(false);
            toast.error("Request timed out. Check your internet connection and try again.");
        }, 10000);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'customer',
                        full_name: name,
                        phone: phone
                    }
                }
            });

            clearTimeout(timeoutId);
            if (error) throw error;

            if (data.user) {
                if (data.session) {
                    toast.success("Account created successfully! Welcome to NearMitra.");
                } else {
                    toast.success("Account created! Check your email to confirm your account, then log in.");
                }
                navigate('/login');
            } else {
                toast.error("Signup failed. Please try again.");
            }

        } catch (err: any) {
            clearTimeout(timeoutId);
            console.error("Signup error details:", err);
            const msg = err?.message || "An unexpected error occurred.";
            if (msg === 'Failed to fetch') {
                toast.error("Network error. Please check your connection or disable any ad-blockers.");
            } else if (msg.toLowerCase().includes('already registered')) {
                toast.error("This email is already registered. Try logging in instead.");
            } else {
                toast.error(msg);
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

                <div className="relative text-center max-w-md">
                    <Link to="/" className="inline-flex items-center gap-2 mb-10">
                        <img src="/logo-icon.svg" alt="Logo" className="w-12 h-12 brightness-0 invert" />
                        <span className="text-2xl font-bold text-white">NearMitra</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Join 10,000+ Happy Homes
                    </h2>
                    <p className="text-white/50 mb-10 leading-relaxed">
                        Create your account and get access to verified home service professionals.
                    </p>

                    <div className="space-y-3">
                        {[
                            { icon: Shield, text: 'Background-verified Professionals' },
                            { icon: Star, text: 'Transparent & Upfront Pricing' },
                            { icon: Clock, text: 'Pay Only After Satisfaction' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-white/60 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <item.icon className="w-4 h-4" />
                                </div>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="max-w-sm w-full animate-fade-in-up">
                    {/* Mobile: back + logo */}
                    <div className="lg:hidden mb-8">
                        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
                        </Link>
                        <div className="flex items-center gap-2">
                            <img src="/logo-icon.svg" alt="Logo" className="w-9 h-9" />
                            <span className="text-xl font-bold text-foreground">NearMitra</span>
                        </div>
                    </div>

                    <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
                        <p className="text-muted-foreground text-sm">Join NearMitra for easy home repairs</p>
                    </div>

                    {/* Google Signup */}
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: { redirectTo: `${window.location.origin}/` }
                                });
                                if (error) toast.error(error.message);
                            } catch (error) {
                                console.error(error);
                                toast.error('Google signup failed');
                            }
                        }}
                        className="w-full border border-border bg-card hover:bg-secondary py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-3 text-sm mb-6 shadow-sm hover:shadow-md"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-foreground">Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-foreground">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
                                        placeholder="+91..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Must include a number and special character</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center text-base mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                        </button>
                        <p className="text-[11px] text-center text-muted-foreground mt-3">
                            By creating an account, you agree to our{' '}
                            <Link to="/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                                Privacy Policy
                            </Link>.
                        </p>
                    </form>

                    <p className="mt-6 text-center text-muted-foreground text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CustomerSignup;
