import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Star, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Zap, 
  Hammer, 
  Droplets, 
  Paintbrush, 
  Wind, 
  BadgeCheck, 
  MapPin, 
  HelpCircle, 
  CreditCard, 
  ChevronDown, 
  Search,
  Check,
  ShieldCheck,
  RefreshCw,
  Sparkles as SparklesIcon,
  ChevronLeft,
  Grid3X3,
  Phone,
  ArrowUpRight,
  Loader2,
  Navigation
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HowItWorks } from '@/components/HowItWorks';

import electricianImg from '@/assets/service-electrician.jpg';
import carpenterImg from '@/assets/service-carpenter.jpg';
import plumberImg from '@/assets/service-plumber.jpg';
import painterImg from '@/assets/service-painter.jpg';
import acImg from '@/assets/service-ac.jpg';
import cleaningImg from '@/assets/service-cleaning.jpg';
import maidImg from '@/assets/service-maid.jpg';

// ─── SERVICE DATA (Circle Grid) ─────────────────────────────────────────────
const SERVICES = [
  { id: 'electrician', name_en: 'Electrician', name_hi: 'इलेक्ट्रीशियन', name_mr: 'इलेक्ट्रीशियन', icon: Zap, color: 'from-amber-400 to-amber-600', popular: true },
  { id: 'plumber', name_en: 'Plumber', name_hi: 'प्लंबर', name_mr: 'प्लंबर', icon: Droplets, color: 'from-blue-400 to-blue-600', popular: true },
  { id: 'carpenter', name_en: 'Carpenter', name_hi: 'कारपेंटर', name_mr: 'सुतार', icon: Hammer, color: 'from-orange-400 to-orange-600', popular: false },
  { id: 'painter', name_en: 'Painter', name_hi: 'पेंटर', name_mr: 'पेंटर', icon: Paintbrush, color: 'from-rose-400 to-rose-600', popular: false },
  { id: 'ac-repair', name_en: 'AC Repair', name_hi: 'AC रिपेयर', name_mr: 'AC रिपेअर', icon: Wind, color: 'from-cyan-400 to-cyan-600', popular: true },
  { id: 'cleaning', name_en: 'Cleaning', name_hi: 'क्लीनिंग', name_mr: 'क्लिनिंग', icon: SparklesIcon, color: 'from-emerald-400 to-emerald-600', popular: true },
  { id: 'maid', name_en: 'Maid', name_hi: 'हाउस मेड', name_mr: 'घरकाम', icon: SparklesIcon, color: 'from-violet-400 to-violet-600', popular: false },
];

// ─── PROMO BANNERS ───────────────────────────────────────────────────────────
const PROMO_BANNERS = [
  {
    id: 1,
    title: '30% OFF AC Jet Servicing',
    subtitle: 'Deep clean + gas check + 30-day warranty',
    cta: 'Book Now',
    link: '/book?service=ac-repair',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    emoji: '❄️',
  },
  {
    id: 2,
    title: 'Full Home Deep Cleaning ₹999',
    subtitle: 'Kitchen + bathroom sanitization combo',
    cta: 'Grab Deal',
    link: '/book?service=cleaning',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    emoji: '✨',
  },
  {
    id: 3,
    title: 'Electrician in 30 Minutes',
    subtitle: 'Switchboard, wiring & fan repair — same day',
    cta: 'Book Now',
    link: '/book?service=electrician',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    emoji: '⚡',
  },
];

// ─── TRENDING PACKAGES (Horizontal Scroll) ───────────────────────────────────
const TRENDING_PACKAGES = [
  {
    id: 'ac-master',
    serviceKey: 'ac-repair',
    title: 'AC Master Jet Servicing',
    category: 'AC Repair',
    originalPrice: 699,
    price: 499,
    discount: '28% OFF',
    rating: 4.9,
    reviews: '2.4k',
    duration: '45 mins',
    badge: '🔥 Most Booked',
    image: acImg,
  },
  {
    id: 'fan-switch-tuneup',
    serviceKey: 'electrician',
    title: 'Fan & Switchboard Check',
    category: 'Electrician',
    originalPrice: 299,
    price: 199,
    discount: '33% OFF',
    rating: 4.8,
    reviews: '1.8k',
    duration: '30 mins',
    badge: '⚡ Quick Fix',
    image: electricianImg,
  },
  {
    id: 'tap-drain-overhaul',
    serviceKey: 'plumber',
    title: 'Tap Leakage Overhaul',
    category: 'Plumber',
    originalPrice: 349,
    price: 249,
    discount: '28% OFF',
    rating: 4.8,
    reviews: '1.5k',
    duration: '35 mins',
    badge: '💧 Water Saver',
    image: plumberImg,
  },
  {
    id: 'deep-home-cleaning',
    serviceKey: 'cleaning',
    title: 'Kitchen & Bath Sanitization',
    category: 'Deep Cleaning',
    originalPrice: 1499,
    price: 999,
    discount: '33% OFF',
    rating: 4.9,
    reviews: '3.1k',
    duration: '2-3 hrs',
    badge: '✨ Premium',
    image: cleaningImg,
  },
  {
    id: 'carpentry-fix',
    serviceKey: 'carpenter',
    title: 'Furniture & Door Repair',
    category: 'Carpenter',
    originalPrice: 399,
    price: 299,
    discount: '25% OFF',
    rating: 4.7,
    reviews: '980',
    duration: '1 hr',
    badge: '🔨 Skilled',
    image: carpenterImg,
  },
];

// ─── TRUST BADGES (Inline Strip) ─────────────────────────────────────────────
const TRUST_BADGES = [
  { icon: BadgeCheck, text: 'Verified Pros', color: 'text-primary bg-primary/8' },
  { icon: Clock, text: '30-Min Arrival', color: 'text-accent bg-accent/8' },
  { icon: RefreshCw, text: '30-Day Warranty', color: 'text-emerald-600 bg-emerald-500/8' },
  { icon: CreditCard, text: 'Pay After Service', color: 'text-blue-600 bg-blue-500/8' },
  { icon: ShieldCheck, text: '₹10K Protection', color: 'text-violet-600 bg-violet-500/8' },
];

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    id: 1,
    name: 'Priya S.',
    locality: 'Bandra West',
    service: 'AC Service',
    rating: 5,
    date: '3 days ago',
    comment: 'Technician arrived in 25 mins on Sunday. Both units jet washed. Cooling difference was instant!',
  },
  {
    id: 2,
    name: 'Rajesh P.',
    locality: 'Andheri East',
    service: 'Electrician',
    rating: 5,
    date: '1 week ago',
    comment: 'Kitchen tripped completely. Electrician came in 30 mins, replaced the melted breaker safely. Honest rate.',
  },
  {
    id: 3,
    name: 'Anita D.',
    locality: 'Powai',
    service: 'Deep Cleaning',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Two-person team worked for 3 hours. Grease stains on chimney and tiles totally gone. Highly recommend!',
  },
  {
    id: 4,
    name: 'Vikram J.',
    locality: 'Thane West',
    service: 'Plumber',
    rating: 5,
    date: 'Recently',
    comment: 'Persistent tap leak fixed in 20 minutes with original parts. 30-day warranty card provided.',
  },
];

// ─── FAQS ────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How quickly can a technician reach my home?',
    a: 'For urgent bookings, our hyperlocal dispatch matches you with the nearest technician, typically arriving within 30-45 minutes. You can also schedule up to 7 days in advance.',
  },
  {
    q: 'How are NearMitra professionals verified?',
    a: 'Every partner undergoes 3-step screening: Aadhaar identity verification, criminal background check, and practical trade skills assessment with safety training.',
  },
  {
    q: 'What is the 30-Day Service Guarantee?',
    a: 'If the exact repair issue reoccurs within 30 days, report it and a senior technician will resolve it with ₹0 additional labor charge.',
  },
  {
    q: 'Do I have to pay any advance?',
    a: 'Never! No advance deposit required. Pay only after the job is completed and inspected. UPI, Card, or Cash accepted.',
  },
  {
    q: 'Can I cancel or reschedule without penalty?',
    a: 'Yes! Cancel or reschedule free of charge up to 1 hour before the scheduled time slot.',
  },
];

const PHONE_NUMBER = '+919152106425';

// ─── SCROLL ANIMATION HOOK ──────────────────────────────────────────────────
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currentBanner, setCurrentBanner] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // ── Geolocation State ──────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<string>('Mumbai, Maharashtra');
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  // Auto-fetch current location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=16`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (!res.ok) throw new Error('Geocoding failed');
          const data = await res.json();
          const addr = data.address || {};
          // Build a friendly location string: suburb/neighbourhood, city
          const locality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.town ||
            addr.county ||
            '';
          const city =
            addr.city ||
            addr.state_district ||
            addr.state ||
            '';
          const display = locality && city
            ? `${locality}, ${city}`
            : locality || city || 'Mumbai, Maharashtra';
          setUserLocation(display);
          setLocationError(false);
        } catch {
          setLocationError(true);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        // Permission denied or error
        setLocationLoading(false);
        setLocationError(false); // silently fall back, not an "error" per se
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  const getName = (s: typeof SERVICES[0]) =>
    language === 'hi' ? s.name_hi : language === 'mr' ? s.name_mr : s.name_en;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  // Auto-slide promo banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Section scroll reveals
  const servicesReveal = useScrollReveal();
  const trustReveal = useScrollReveal();
  const trendingReveal = useScrollReveal();
  const howItWorksReveal = useScrollReveal();
  const reviewsReveal = useScrollReveal();
  const faqReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <div className="pb-24 md:pb-0 overflow-x-hidden bg-background">

      {/* ══════════════════════════════════════════════════════════════════════
          1. COMPACT APP-STYLE HEADER AREA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-background pt-2 pb-1">
        <div className="container mx-auto px-4">

          {/* Location bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Your Location</p>
                {locationLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-foreground flex items-center gap-1">
                    <span className="max-w-[200px] sm:max-w-none truncate">{userLocation}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                18 technicians active
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="flex items-center bg-card rounded-2xl px-4 py-3 shadow-sm border border-border/60 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
              <Search className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for electrician, plumber, AC repair..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
              />
            </div>
          </form>

          {/* Promo Banner Carousel */}
          <div className="relative overflow-hidden rounded-2xl mb-2">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {PROMO_BANNERS.map((banner) => (
                <Link
                  key={banner.id}
                  to={banner.link}
                  className="w-full flex-shrink-0"
                >
                  <div className={`bg-gradient-to-r ${banner.gradient} rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                      <span className="text-2xl mb-1 block">{banner.emoji}</span>
                      <h3 className="text-lg sm:text-xl font-extrabold mb-1 leading-tight">
                        {banner.title}
                      </h3>
                      <p className="text-white/80 text-xs sm:text-sm mb-3">{banner.subtitle}</p>
                      <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20">
                        {banner.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Banner dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3 mb-1">
              {PROMO_BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentBanner
                      ? 'w-5 h-1.5 bg-primary'
                      : 'w-1.5 h-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. CIRCLE ICON SERVICE GRID (UC Style)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={servicesReveal.ref}
        className={`py-6 bg-background transition-all duration-700 ${
          servicesReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-extrabold text-foreground">
              What are you looking for?
            </h2>
            <Link
              to="/services"
              className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Circle grid — 4 per row on mobile */}
          <div className="grid grid-cols-4 gap-y-5 gap-x-3 sm:grid-cols-4 md:grid-cols-7 max-w-lg md:max-w-none mx-auto">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.id}
                  to={`/book?service=${service.id}`}
                  className="flex flex-col items-center group"
                  style={{
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <div className="relative mb-2">
                    {/* Circle icon container */}
                    <div className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={1.8} />
                    </div>
                    {/* Popular badge */}
                    {service.popular && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[7px] font-black flex items-center justify-center shadow-sm">
                        ★
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-foreground text-center leading-tight line-clamp-2">
                    {getName(service)}
                  </span>
                </Link>
              );
            })}

            {/* View All circle */}
            <Link
              to="/services"
              className="flex flex-col items-center group"
            >
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-secondary border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 group-active:scale-95 transition-all duration-300">
                <Grid3X3 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground text-center mt-2 group-hover:text-primary transition-colors">
                View All
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. TRUST STRIP (Inline Horizontal Badges)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={trustReveal.ref}
        className={`pb-4 bg-background transition-all duration-700 delay-100 ${
          trustReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {TRUST_BADGES.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 ${badge.color} px-3.5 py-2 rounded-xl flex-shrink-0 border border-border/30`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. TRENDING PACKAGES — Horizontal Swipe Cards
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={trendingReveal.ref}
        className={`py-8 bg-secondary/30 transition-all duration-700 ${
          trendingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-accent font-bold text-[11px] uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Top Picks
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground">
                Most Booked Services
              </h2>
            </div>
            <Link
              to="/services"
              className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Horizontal scroll container */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4"
          >
            {TRENDING_PACKAGES.map((pkg, index) => (
              <Link
                key={pkg.id}
                to={`/book?service=${pkg.serviceKey}&task=${encodeURIComponent(pkg.title)}`}
                className="flex-shrink-0 w-[260px] sm:w-[280px] bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 snap-start group"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Image */}
                <div className="relative h-32 sm:h-36 overflow-hidden">
                  <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Badge */}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                    {pkg.badge}
                  </span>
                  {/* Discount */}
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-lg">
                    {pkg.discount}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    {pkg.category}
                  </p>
                  <h3 className="text-sm font-bold text-foreground mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {pkg.title}
                  </h3>

                  {/* Rating + Duration */}
                  <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 text-yellow-500 font-bold">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      {pkg.rating}
                    </span>
                    <span>({pkg.reviews})</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pkg.duration}
                    </span>
                  </div>

                  {/* Price row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-foreground">₹{pkg.price}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{pkg.originalPrice}</span>
                    </div>
                    <span className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/8 px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                      Add
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={howItWorksReveal.ref}
        className={`transition-all duration-700 ${
          howItWorksReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <HowItWorks />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          6. CUSTOMER REVIEWS — Horizontal Carousel
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={reviewsReveal.ref}
        className={`py-10 md:py-16 bg-secondary/30 transition-all duration-700 ${
          reviewsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Header + aggregate rating */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-yellow-500 font-bold text-[11px] uppercase tracking-wider mb-1">
                <Star className="w-3 h-3 fill-yellow-400" />
                Verified Reviews
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground">
                Loved by 10,000+ Homes
              </h2>
            </div>
            {/* Aggregate pill */}
            <div className="flex items-center gap-2 bg-card border border-border/60 px-3 py-2 rounded-xl shadow-xs">
              <span className="text-lg font-black text-yellow-500">4.8</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>

          {/* Horizontal review cards */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4">
            {TESTIMONIALS.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0 w-[280px] sm:w-[300px] bg-card border border-border/60 rounded-2xl p-5 shadow-xs snap-start flex flex-col justify-between"
              >
                <div>
                  {/* Stars + date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-4 line-clamp-4">
                    "{review.comment}"
                  </p>
                </div>

                {/* Author */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar initial */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{review.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {review.locality}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold bg-primary/8 text-primary px-2 py-0.5 rounded-full">
                    {review.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. FAQ ACCORDION
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={faqReveal.ref}
        className={`py-10 md:py-16 bg-background transition-all duration-700 ${
          faqReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-primary font-bold text-[11px] uppercase tracking-wider mb-1">
              <HelpCircle className="w-3 h-3" />
              FAQs
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-foreground">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-3.5 px-5 text-left font-bold text-sm text-foreground flex items-center justify-between gap-3 hover:text-primary transition-colors"
                  >
                    <span className="text-[13px] sm:text-sm">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-4 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Still have questions?{' '}
            <Link to="/contact" className="text-primary font-semibold hover:underline">
              Talk to our 24/7 helpline
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. CLEAN CTA SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={ctaReveal.ref}
        className={`py-10 md:py-16 transition-all duration-700 ${
          ctaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(189,69%,30%)] via-[hsl(189,69%,24%)] to-[hsl(200,60%,16%)]" />
            <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

            <div className="relative p-8 sm:p-12 text-center text-white">
              <span className="inline-block bg-white/10 text-white/90 text-[11px] font-bold px-3 py-1.5 rounded-full mb-4 border border-white/15">
                Ready to Experience NearMitra?
              </span>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 max-w-xl mx-auto leading-tight">
                {t('needHelpTitle')}
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mb-7 max-w-md mx-auto">
                {t('needHelpSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="inline-flex items-center justify-center gap-2.5 bg-white text-foreground font-bold py-3.5 px-6 rounded-2xl hover:bg-white/90 transition-all shadow-lg text-sm active:scale-95"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  {t('callNow')}
                </a>
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg text-sm active:scale-95"
                >
                  {t('bookAService')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Policy links */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap justify-center items-center gap-3 text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-accent" />
                  30-Day Guarantee
                </span>
                <span>•</span>
                <Link to="/terms" className="hover:text-white transition-colors underline">
                  Terms
                </Link>
                <span>•</span>
                <Link to="/privacy" className="hover:text-white transition-colors underline">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
