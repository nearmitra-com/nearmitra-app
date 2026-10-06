import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const AdminLogin = () => {
  const { t } = useLanguage();
  const { signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user && role === 'admin') {
      navigate('/admin');
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: t('loginFailed'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('loginSuccess'),
        description: t('welcomeBack'),
      });
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('adminLogin')}</CardTitle>
          <CardDescription>{t('adminLoginDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={async () => {
              setEmail('admin@nearmitra.com');
              setPassword('admin123');
              setIsLoading(true);
              const { error } = await signIn('admin@nearmitra.com', 'admin123');
              setIsLoading(false);
              if (error) {
                toast({ title: t('loginFailed'), description: error.message, variant: 'destructive' });
              } else {
                toast({ title: 'Welcome Admin!', description: 'Redirecting to Admin Dashboard…' });
                navigate('/admin');
              }
            }}
            className="w-full mb-4 py-2.5 px-4 bg-primary/10 border border-primary/30 text-primary font-bold rounded-xl text-sm hover:bg-primary hover:text-primary-foreground transition-all shadow-sm flex items-center justify-center gap-2"
          >
            ⚡ 1-Click Admin
          </button>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ nearmitra.com"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('loggingIn') : t('login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
