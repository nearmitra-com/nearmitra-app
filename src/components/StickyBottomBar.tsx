import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, Plus, Package, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const tabs = [
  { to: '/', icon: Home, label: 'Home', labelHi: 'होम', labelMr: 'होम' },
  { to: '/services', icon: Wrench, label: 'Services', labelHi: 'सेवाएं', labelMr: 'सेवा' },
  { to: '/book', icon: Plus, label: 'Book', labelHi: 'बुक करें', labelMr: 'बुक करा', isCenter: true },
  { to: '/track', icon: Package, label: 'Bookings', labelHi: 'बुकिंग', labelMr: 'बुकिंग' },
  { to: '/login', icon: User, label: 'Account', labelHi: 'अकाउंट', labelMr: 'अकाउंट' },
];

export const StickyBottomBar = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getLabel = (tab: typeof tabs[0]) =>
    language === 'hi' ? tab.labelHi : language === 'mr' ? tab.labelMr : tab.label;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Glassmorphic background */}
      <div className="bg-card/85 backdrop-blur-2xl border-t border-border/60 shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        <nav className="flex items-end justify-around px-2 pt-1.5 pb-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.to);

            // Center "Book" button — elevated accent style
            if (tab.isCenter) {
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="flex flex-col items-center -mt-5 relative"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-[hsl(24,92%,46%)] flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition-transform duration-200">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-accent mt-1">
                    {getLabel(tab)}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                  active ? '' : ''
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors duration-200 ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {active && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 transition-colors duration-200 ${
                    active
                      ? 'font-bold text-primary'
                      : 'font-medium text-muted-foreground'
                  }`}
                >
                  {getLabel(tab)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
