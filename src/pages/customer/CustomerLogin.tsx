
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, Shield, Star, Clock } from 'lucide-react';

const CustomerLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Login successful!");
                navigate('/');
            }
        } catch (error) {
            toast.error("An error occurred during login.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            });
            if (error) toast.error(error.message);
        } catch (error) {
            console.error(error);
            toast.error('Google login failed');
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
                <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

                <div className="relative text-center max-w-md">
                    <Link to="/" className="inline-flex items-center gap-2 mb-10">
                        <img src="/logo-icon.svg" alt="Logo" className="w-12 h-12 brightness-0 invert" />
                        <span className="text-2xl font-bold text-white">NearMitra</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Reliable Home Services at Your Doorstep
                    </h2>
                    <p className="text-white/50 mb-10 leading-relaxed">
                        Book verified local technicians in minutes. Upfront pricing, zero advance fees.
                    </p>

                    {/* Trust badges */}
                    <div className="space-y-3">
                        {[
                            { icon: Shield, text: '100% Verified Technicians' },
                            { icon: Star, text: '4.8 Average Rating' },
                            { icon: Clock, text: 'Same-Day Service Available' },
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

                    {/* Desktop: back link */}
                    <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
                    </Link>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome Back</h1>
                        <p className="text-muted-foreground text-sm">Login to book services and track history</p>
                    </div>

                    {/* Demo Customer 1-Click */}
                    <button
                        type="button"
                        onClick={async () => {
                            setEmail('customer@nearmitra.com');
                            setPassword('customer123');
                            setLoading(true);
                            const { error } = await supabase.auth.signInWithPassword({
                                email: 'customer@nearmitra.com',
                                password: 'customer123',
                            });
                            setLoading(false);
                            if (error) toast.error(error.message);
                            else {
                                toast.success("Logged in as Demo Customer (Pooja Verma)");
                                navigate('/');
                            }
                        }}
                        className="w-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm mb-4 shadow-sm"
                    >
                        ⚡ 1-Click Demo Login (Pooja Verma)
                    </button>

                    {/* Google Login (primary - UC style) */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
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
                            <span className="bg-background px-3 text-muted-foreground">or login with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center text-base mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-muted-foreground text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary font-semibold hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CustomerLogin;
