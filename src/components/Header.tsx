import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Language } from '@/i18n/translations';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'hi', label: 'हिंदी', flag: 'https://flagcdn.com/w40/in.png' },
  { code: 'mr', label: 'मराठी', flag: 'https://flagcdn.com/w40/in.png' },
];

export const Header = () => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut, role } = useAuth();
  const location = useLocation();

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Track scroll for glassmorphic effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Build nav links with clear access to all core sections
  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/services', label: t('services') },
    { to: '/book', label: t('bookService') },
    { to: '/track', label: t('trackBooking') },
    { to: role === 'provider' ? '/provider' : '/provider-login', label: role === 'provider' ? 'Provider Dashboard' : 'Partner Portal' },
    { to: '/contact', label: t('contact') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-card/80 backdrop-blur-xl shadow-lg border-b border-border/50'
        : 'bg-card border-b border-border/50 shadow-xs'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 flex-shrink-0 group transition-opacity hover:opacity-90">
            <div className="w-9 h-9 sm:w-10 sm:h-10 aspect-square flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img
                src="/logo-icon.svg"
                alt="Logo"
                width={100}
                height={100}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-base sm:text-lg md:text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">
              {t('brandName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isActive(link.to)
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
              >
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary transition-all duration-300 border border-border/50"
              >
                <img src={currentLang.flag} alt={currentLang.label} className="w-5 h-auto rounded-sm" />
                <span className="hidden sm:inline text-sm font-medium">{currentLang.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-card rounded-xl shadow-xl border border-border/50 z-20 overflow-hidden animate-slide-down">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-all duration-200 ${language === lang.code ? 'bg-primary/5 text-primary font-medium' : ''
                          }`}
                      >
                        <img src={lang.flag} alt={lang.label} className="w-5 h-auto rounded-sm" />
                        <span>{lang.label}</span>
                        {language === lang.code && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-1.5">
                {/* Notification Bell — shown for logged-in users */}
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/15">
                      <User className="h-5 w-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 pb-2 border-b border-border/50">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-muted-foreground">Signed in as</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {role || 'User'}
                        </span>
                      </div>
                      <span className="font-semibold text-sm truncate max-w-full text-foreground">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/track" className="cursor-pointer">📦 My Bookings & Tracking</Link>
                    </DropdownMenuItem>

                    {role === 'provider' ? (
                      <DropdownMenuItem asChild>
                        <Link to="/provider" className="cursor-pointer">🛠️ Provider Dashboard</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link to="/provider-login" className="cursor-pointer">🛠️ Partner / Provider Login</Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link to="/admin-login" className="cursor-pointer text-xs text-muted-foreground">👑 Admin Login</Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer border-t border-border/50 mt-1">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/login">
                <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-xl px-5 shadow-md hover:shadow-lg transition-all duration-300">
                  Login
                </Button>
              </Link>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
