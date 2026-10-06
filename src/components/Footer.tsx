import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-white mt-auto relative overflow-hidden">
      {/* Decorative top wave */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      {/* Decorative circles */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-primary/5" />
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-accent/5" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 p-1.5 transition-transform duration-300 group-hover:scale-110">
                <img src="/logo-icon.svg" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="text-xl font-bold tracking-tight">{t('brandName')}</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              {t('footerTagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">{t('quickLinks')}</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: t('home') },
                { to: '/services', label: t('services') },
                { to: '/book', label: t('bookService') },
                { to: '/contact', label: t('contact') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-1.5 text-white/50 hover:text-white transition-colors duration-300 text-sm"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">{t('forProviders')}</h4>
            <ul className="space-y-3">
              {[
                { to: '/provider-login', label: t('providerLogin') },
                { to: '/provider', label: t('providerPortal') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-1.5 text-white/50 hover:text-white transition-colors duration-300 text-sm"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">{t('contactUs')}</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+919152106425" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-300 text-sm group">
                  <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>+91 91521 06425</span>
                </a>
              </li>
              <li>
                <a href="mailto:support@nearmitra.in" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-300 text-sm group">
                  <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>support@nearmitra.in</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/50 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} NearMitra. {t('allRightsReserved')}
          </p>
          <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
            <Link to="/privacy" className="text-white/50 hover:text-white transition-colors duration-300">
              {t('privacyPolicy')}
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/terms" className="text-white/50 hover:text-white transition-colors duration-300">
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
