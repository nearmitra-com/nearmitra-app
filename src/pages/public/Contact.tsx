import { Phone, MessageCircle, Mail, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const PHONE_NUMBER = '+919152106425';
const WHATSAPP_NUMBER = '919152106425';
const EMAIL = 'support@nearmitra.in';

const Contact = () => {
  const { t } = useLanguage();

  const contactCards = [
    {
      icon: Phone,
      title: t('callUs'),
      subtitle: '+91 91521 06425',
      href: `tel:${PHONE_NUMBER}`,
      gradient: 'from-[hsl(189,69%,34%)] to-[hsl(189,69%,24%)]',
      bg: 'bg-primary/8',
    },
    {
      icon: MessageCircle,
      title: t('whatsappUs'),
      subtitle: '+91 91521 06425',
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      gradient: 'from-[hsl(142,70%,45%)] to-[hsl(142,70%,35%)]',
      bg: 'bg-[hsl(142,70%,45%)]/8',
      external: true,
    },
    {
      icon: Mail,
      title: t('emailUs'),
      subtitle: EMAIL,
      href: `mailto:${EMAIL}`,
      gradient: 'from-[hsl(24,92%,56%)] to-[hsl(24,92%,44%)]',
      bg: 'bg-accent/8',
    },
  ];

  return (
    <div className="pb-24 md:pb-0">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Get In Touch
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('contactUs')}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Have a question or need help? We're here for you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="max-w-xl mx-auto space-y-4">
          {contactCards.map((card, index) => (
            <a
              key={index}
              href={card.href}
              target={card.external ? '_blank' : undefined}
              rel={card.external ? 'noopener noreferrer' : undefined}
              className="group flex items-center gap-5 p-5 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-400 hover:-translate-y-0.5"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base">{card.title}</h3>
                <p className="text-muted-foreground text-sm truncate">{card.subtitle}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
            </a>
          ))}

          {/* Support Hours Card */}
          <div className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-border/50">
            <div className="flex items-center gap-4 text-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Support Hours</p>
                <p className="text-muted-foreground text-sm">{t('supportMessage')}</p>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-4 p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Office Location</p>
                <p className="text-muted-foreground text-sm">Mumbai, Maharashtra, India</p>
              </div>
            </div>
            <Link
              to="/book"
              className="btn-accent w-full text-center block py-3 rounded-xl text-sm"
            >
              Book a Service Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
