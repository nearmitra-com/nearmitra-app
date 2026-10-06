import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  ArrowRight,
  Zap,
  Hammer,
  Droplets,
  Paintbrush,
  Wind,
  Sparkles,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  MapPin,
  Tag,
  Copy,
  Check,
  Grid,
  List as ListIcon,
  Mic,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Phone,
  MessageCircle,
  Wrench,
  ThumbsUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { toast } from 'sonner';

// Import local service images
import electricianImg from '@/assets/service-electrician.jpg';
import carpenterImg from '@/assets/service-carpenter.jpg';
import plumberImg from '@/assets/service-plumber.jpg';
import painterImg from '@/assets/service-painter.jpg';
import acImg from '@/assets/service-ac.jpg';
import cleaningImg from '@/assets/service-cleaning.jpg';
import maidImg from '@/assets/service-maid.jpg';

export interface ServicePackage {
  id: string;
  title: string;
  price: number;
  time: string;
  desc: string;
  popular?: boolean;
}

export interface AppServiceItem {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  category: string;
  icon: React.ElementType;
  starting_price: number;
  image: string;
  color: string;
  desc: string;
  rating: number;
  reviews_count: string;
  eta: string;
  badge: string;
  included: string[];
  packages: ServicePackage[];
}

// ── Complete Mobile App-Optimized Services Catalog ───────────────────────────
const STATIC_SERVICES: AppServiceItem[] = [
  {
    id: 'electrician',
    name_en: 'Electrician',
    name_hi: 'इलेक्ट्रीशियन',
    name_mr: 'इलेक्ट्रीशियन',
    category: 'electrical',
    icon: Zap,
    starting_price: 199,
    image: electricianImg,
    color: 'from-amber-400 to-amber-600',
    desc: 'Fan repair, short-circuit, modular switches & MCB troubleshooting',
    rating: 4.8,
    reviews_count: '1.4k+',
    eta: '30-45 mins',
    badge: '⚡ 30m Arrival',
    included: [
      'Complete voltage & circuit inspection',
      'Original spare parts testing & installation',
      'Post-service safety & earthing check',
      '30-day rework warranty',
    ],
    packages: [
      {
        id: 'fan',
        title: 'Ceiling Fan Repair / Regulating',
        price: 199,
        time: '30 mins',
        desc: 'Capacitor replacement, blade alignment, sound vibration & speed regulator fix',
        popular: true,
      },
      {
        id: 'switch',
        title: 'Switchboard & Socket Replacement',
        price: 149,
        time: '20 mins',
        desc: 'Burnt socket repair, smart switch replacement, modular plate mounting',
      },
      {
        id: 'mcb',
        title: 'MCB Tripping & Short Circuit Fix',
        price: 249,
        time: '40 mins',
        desc: 'Distribution box diagnostic, circuit overload resolution, main breaker fix',
        popular: true,
      },
      {
        id: 'wiring',
        title: 'Full House Electrical Safety Check',
        price: 399,
        time: '60 mins',
        desc: 'Complete wire earthing inspection, load analysis & meter board health check',
      },
    ],
  },
  {
    id: 'plumber',
    name_en: 'Plumber',
    name_hi: 'प्लंबर',
    name_mr: 'प्लंबर',
    category: 'plumbing',
    icon: Droplets,
    starting_price: 199,
    image: plumberImg,
    color: 'from-blue-400 to-blue-600',
    desc: 'Pipe leaks, tap drips, drain blockage, flush & water pump repairs',
    rating: 4.8,
    reviews_count: '1.2k+',
    eta: '30-45 mins',
    badge: '💧 Leak Specialist',
    included: [
      'Water pressure & leak detection',
      'Heavy-duty Teflon tape & gasket sealing',
      'Clean & sanitized work zone after fix',
      '30-day rework warranty',
    ],
    packages: [
      {
        id: 'tap',
        title: 'Tap Repair & Water Leakage Fix',
        price: 199,
        time: '25 mins',
        desc: 'Fix dripping faucets, internal spindle replacement, basin mixer seal',
        popular: true,
      },
      {
        id: 'drain',
        title: 'Sink & Bathroom Drain Unclogging',
        price: 249,
        time: '35 mins',
        desc: 'Deep drain snake cleaning for kitchen sinks, washbasins and floor traps',
        popular: true,
      },
      {
        id: 'flush',
        title: 'Toilet Flush & Jet Spray Replacement',
        price: 219,
        time: '30 mins',
        desc: 'Syphon adjustment, ball-valve fix, high pressure bidet jet spray fitting',
      },
      {
        id: 'tank',
        title: 'Overhead Tank Valve & Motor Check',
        price: 349,
        time: '45 mins',
        desc: 'Overflow float valve repair, pump inlet piping check & union leak fix',
      },
    ],
  },
  {
    id: 'carpenter',
    name_en: 'Carpenter',
    name_hi: 'कारपेंटर',
    name_mr: 'सुतार',
    category: 'carpentry',
    icon: Hammer,
    starting_price: 249,
    image: carpenterImg,
    color: 'from-orange-400 to-orange-600',
    desc: 'Door lock fix, cupboard hinges, furniture assembly & woodwork',
    rating: 4.7,
    reviews_count: '980+',
    eta: '45-60 mins',
    badge: '🪵 Expert Woodwork',
    included: [
      'Laser-level alignment & precise cutting',
      'High-grade screws & fitting hardware used',
      'Free minor squeak & hinge lubrication',
      '30-day rework warranty',
    ],
    packages: [
      {
        id: 'lock',
        title: 'Door Lock & Handle Installation',
        price: 249,
        time: '35 mins',
        desc: 'Main door latch, cylindrical knob or mortise lock alignment & fitting',
        popular: true,
      },
      {
        id: 'hinge',
        title: 'Cupboard Hinge & Channel Repair',
        price: 199,
        time: '25 mins',
        desc: 'Soft-close hydraulic hinge replacement, loose sliding drawer rail fix',
      },
      {
        id: 'assembly',
        title: 'Furniture Assembly & Bed Tightening',
        price: 349,
        time: '45 mins',
        desc: 'Online flatpack furniture, study desk, shoe rack or bed frame setup',
        popular: true,
      },
      {
        id: 'door-align',
        title: 'Door Jamming & Friction Planing',
        price: 299,
        time: '40 mins',
        desc: 'Trimming swollen wooden doors, floor rubbing noise fix & stopper install',
      },
    ],
  },
  {
    id: 'painter',
    name_en: 'Painter',
    name_hi: 'पेंटर',
    name_mr: 'पेंटर',
    category: 'painting',
    icon: Paintbrush,
    starting_price: 299,
    image: painterImg,
    color: 'from-rose-400 to-rose-600',
    desc: 'Wall touch-ups, water seepage waterproofing, room painting',
    rating: 4.8,
    reviews_count: '820+',
    eta: '60 mins',
    badge: '🎨 Premium Finish',
    included: [
      'Surface sanding & acrylic putty priming',
      'Protective masking on floor & electronics',
      'Uniform dual-coat roller application',
      'Authentic certified paint brands',
    ],
    packages: [
      {
        id: 'touchup',
        title: 'Wall Touch-up & Patch Painting',
        price: 399,
        time: '60 mins',
        desc: 'Fix peeling paint, nail hole putty fill, exact shade 2-coat finish',
        popular: true,
      },
      {
        id: 'damp',
        title: 'Water Seepage & Crack Sealing',
        price: 499,
        time: '60 mins',
        desc: 'Anti-fungal polymer coating, crack filling & moisture barrier shield',
        popular: true,
      },
      {
        id: 'room',
        title: 'Single Room Fresh Wall Coat',
        price: 999,
        time: '3 hrs',
        desc: 'Full wall preparation, base primer, 2 coats washable premium emulsion',
      },
      {
        id: 'grille',
        title: 'Balcony / Window Grille Painting',
        price: 499,
        time: '90 mins',
        desc: 'Rust scraping, red-oxide primer & glossy weather-resistant enamel',
      },
    ],
  },
  {
    id: 'ac-repair',
    name_en: 'AC Repair & Service',
    name_hi: 'AC रिपेयर और सर्विस',
    name_mr: 'AC रिपेअर',
    category: 'appliance',
    icon: Wind,
    starting_price: 349,
    image: acImg,
    color: 'from-cyan-400 to-cyan-600',
    desc: 'Deep foam jet service, cooling fixes, gas refill & AC installation',
    rating: 4.9,
    reviews_count: '2.1k+',
    eta: '30-45 mins',
    badge: '❄️ Top Rated 4.9★',
    included: [
      'High-pressure power foam wash for coils',
      'Gas pressure & compressor ampere check',
      'Drainage tray deep sanitation',
      '30-day cooling satisfaction guarantee',
    ],
    packages: [
      {
        id: 'foamjet',
        title: 'AC Foam Jet Deep Power Service',
        price: 499,
        time: '45 mins',
        desc: '2x deeper indoor & outdoor power wash with anti-bacterial foam spray',
        popular: true,
      },
      {
        id: 'gas',
        title: 'AC Gas Leak Check & Full Refill',
        price: 1299,
        time: '60 mins',
        desc: 'Nitrogen leak testing, copper brazing fix & 100% genuine R32/R410 gas',
      },
      {
        id: 'waterleak',
        title: 'AC Water Leakage Troubleshooting',
        price: 349,
        time: '35 mins',
        desc: 'Clear clogged drain line, clean drain tray & adjust indoor unit tilt',
        popular: true,
      },
      {
        id: 'install',
        title: 'AC Installation / Relocation',
        price: 799,
        time: '90 mins',
        desc: 'Heavy-duty wall bracket mounting, copper pipe flare & vacuum test',
      },
    ],
  },
  {
    id: 'cleaning',
    name_en: 'Deep Cleaning',
    name_hi: 'डीप क्लीनिंग',
    name_mr: 'डीप क्लिनिंग',
    category: 'cleaning',
    icon: Sparkles,
    starting_price: 499,
    image: cleaningImg,
    color: 'from-emerald-400 to-emerald-600',
    desc: 'Intensive bathroom, kitchen chimney, sofa & full home sanitization',
    rating: 4.8,
    reviews_count: '1.6k+',
    eta: '45-60 mins',
    badge: '✨ Hospital Grade',
    included: [
      'High-speed rotary scrubber & extraction machine',
      'Eco-friendly safe disinfectants (zero harsh fumes)',
      'Hard-water scale, grease & grout scrub',
      'Final customer walkthrough & inspection',
    ],
    packages: [
      {
        id: 'bath',
        title: 'Intensive Bathroom Deep Scrubbing',
        price: 399,
        time: '45 mins',
        desc: 'Tile stain removal, mirror buff, WC sanitation, exhaust & tap de-scaling',
        popular: true,
      },
      {
        id: 'kitchen',
        title: 'Kitchen Degreasing & Chimney Scrub',
        price: 599,
        time: '60 mins',
        desc: 'Oil degreasing for tiles, chimney filters, stove slab & external cabinets',
        popular: true,
      },
      {
        id: 'sofa',
        title: '3-Seater Sofa / Carpet Shampoo',
        price: 499,
        time: '50 mins',
        desc: 'Wet foam injection, deep fabric extraction, stain & dust mite removal',
      },
      {
        id: 'fullhome',
        title: 'Complete 1/2 BHK Deep Cleaning',
        price: 1499,
        time: '3 hrs',
        desc: 'Full deep scrub of living room, bedrooms, balcony, washrooms & kitchen',
        popular: true,
      },
    ],
  },
  {
    id: 'maid',
    name_en: 'House Maid',
    name_hi: 'हाउस मेड',
    name_mr: 'घरकाम',
    category: 'maid',
    icon: Sparkles,
    starting_price: 299,
    image: maidImg,
    color: 'from-violet-400 to-violet-600',
    desc: 'Daily cleaning, meal prep assistance, dusting, mopping & utensils',
    rating: 4.8,
    reviews_count: '1.1k+',
    eta: 'Same Day',
    badge: '🛡️ 100% ID Verified',
    included: [
      'Government Aadhaar & police background checked',
      'Trained in hygiene and urban apartment norms',
      'Zero advance broker fee or long lock-in',
      'Replacement support if not satisfied',
    ],
    packages: [
      {
        id: 'dusting',
        title: '1-Day Deep Dusting & House Help',
        price: 299,
        time: '60 mins',
        desc: 'Furniture dusting, shelf organizing, floor mopping & trash clearance',
        popular: true,
      },
      {
        id: 'cooking',
        title: 'Cooking & Meal Assistance',
        price: 349,
        time: '75 mins',
        desc: 'Vegetable chopping, fresh soft rotis, dal/sabzi meal prep assistance',
        popular: true,
      },
      {
        id: 'utensils',
        title: 'Utensil Washing & Kitchen Floor Mop',
        price: 249,
        time: '45 mins',
        desc: 'Thorough dish scrubbing, sink sanitization & clean floor wipe',
      },
      {
        id: 'monthly',
        title: 'Monthly Maid Match Consultation',
        price: 0,
        time: 'Free Call',
        desc: 'Connect with reliable recurring domestic help verified in your society',
      },
    ],
  },
];

// Quick Search Tags (mobile pills)
const QUICK_TAGS = [
  '⚡ Fan Repair',
  '💧 Tap Leak',
  '❄️ AC Jet Clean',
  '⚡ Switchboard',
  '🪚 Lock Repair',
  '🧹 Bathroom Clean',
  '🎨 Wall Touch-up',
];

// Available locations for quick mobile picker
const LOCATIONS = [
  'Andheri East & West, Mumbai',
  'Bandra & Khar, Mumbai',
  'Powai & Hiranandani',
  'Thane West (Ghodbunder)',
  'Navi Mumbai (Vashi / Nerul)',
  'Borivali & Kandivali',
  'Dadar & South Mumbai',
];

interface DbService {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  icon: string;
  starting_price: number;
  is_active: boolean;
}

const Services: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // State
  const [dbServices, setDbServices] = useState<DbService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'under250' | 'topRated' | 'express'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Location selector state
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    return localStorage.getItem('nearmitra_user_location') || LOCATIONS[0];
  });
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);

  // Service Detail Bottom Sheet (Drawer)
  const [selectedService, setSelectedService] = useState<AppServiceItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch Database Services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name_en');
      if (!error && data) {
        setDbServices(data.filter((s: DbService) => s.is_active !== false));
      }
    } catch {
      // Fallback works silently
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
    const channel = supabase
      .channel('services-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => fetchServices())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper for localized name
  const getName = (s: AppServiceItem | DbService) => {
    if (language === 'hi' && s.name_hi) return s.name_hi;
    if (language === 'mr' && s.name_mr) return s.name_mr;
    return s.name_en;
  };

  // Convert custom DB services into AppServiceItem if they aren't in STATIC_SERVICES
  const extraDbServices: AppServiceItem[] = dbServices
    .filter((dbS) => !STATIC_SERVICES.some((s) => s.name_en.toLowerCase() === dbS.name_en.toLowerCase()))
    .map((dbS) => ({
      id: dbS.id,
      name_en: dbS.name_en,
      name_hi: dbS.name_hi || dbS.name_en,
      name_mr: dbS.name_mr || dbS.name_en,
      category: 'general',
      icon: Wrench,
      starting_price: dbS.starting_price || 199,
      image: electricianImg,
      color: 'from-teal-500 to-emerald-600',
      desc: 'Expert doorstep diagnostics, reliable fix & transparent pricing',
      rating: 4.8,
      reviews_count: '500+',
      eta: '45 mins',
      badge: '🛡️ Verified Pro',
      included: [
        'Complete doorstep inspection & diagnostic',
        'Standard tools & professional safety kit',
        'Transparent quote before any work begins',
        '30-day rework warranty',
      ],
      packages: [
        {
          id: `${dbS.id}-std`,
          title: `${dbS.name_en} Standard Inspection & Fix`,
          price: dbS.starting_price || 199,
          time: '30 mins',
          desc: 'Doorstep inspection, minor repairs and performance testing',
          popular: true,
        },
        {
          id: `${dbS.id}-deep`,
          title: `Comprehensive ${dbS.name_en} Service`,
          price: Math.round((dbS.starting_price || 199) * 1.6),
          time: '60 mins',
          desc: 'Complete repair overhaul, preventive maintenance and clean up',
        },
      ],
    }));

  const allServices: AppServiceItem[] = [...STATIC_SERVICES, ...extraDbServices];

  // Categories list for horizontal rail
  const categories = [
    { id: 'all', label: 'All Services', icon: Sparkles, color: 'from-primary to-accent' },
    { id: 'electrical', label: 'Electrician', icon: Zap, color: 'from-amber-400 to-amber-600' },
    { id: 'plumbing', label: 'Plumber', icon: Droplets, color: 'from-blue-400 to-blue-600' },
    { id: 'carpentry', label: 'Carpenter', icon: Hammer, color: 'from-orange-400 to-orange-600' },
    { id: 'appliance', label: 'AC Service', icon: Wind, color: 'from-cyan-400 to-cyan-600' },
    { id: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'from-emerald-400 to-emerald-600' },
    { id: 'painting', label: 'Painter', icon: Paintbrush, color: 'from-rose-400 to-rose-600' },
    { id: 'maid', label: 'House Maid', icon: Sparkles, color: 'from-violet-400 to-violet-600' },
  ];

  // Filtering Logic
  const filteredServices = allServices.filter((service) => {
    // 1. Category Filter
    if (selectedCategory !== 'all' && service.category !== selectedCategory) {
      return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName =
        service.name_en.toLowerCase().includes(q) ||
        (service.name_hi && service.name_hi.includes(q)) ||
        (service.name_mr && service.name_mr.includes(q));
      const matchDesc = service.desc.toLowerCase().includes(q);
      const matchPackages = service.packages.some(
        (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      );
      if (!matchName && !matchDesc && !matchPackages) return false;
    }

    // 3. Smart Filter Chips
    if (activeFilter === 'popular' && service.rating < 4.8) return false;
    if (activeFilter === 'under250' && service.starting_price > 250) return false;
    if (activeFilter === 'topRated' && service.rating < 4.85) return false;
    if (activeFilter === 'express' && !service.eta.includes('30')) return false;

    return true;
  });

  // Handle Voice Search Simulation
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
        recognition.onstart = () => {
          toast.info('🎙️ Listening... Speak your service (e.g. "Ceiling fan" or "Plumber")');
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSearchQuery(transcript);
          toast.success(`Found results for "${transcript}"`);
        };
        recognition.onerror = () => {
          toast.info('Voice recognition closed. You can also type above.');
        };
        recognition.start();
      } catch {
        toast.info('Tap any category or search tag below');
      }
    } else {
      toast.info('Search suggestion: Try "Fan Repair" or "AC Service"');
    }
  };

  // Copy Coupon Handler
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast.success(`Coupon code ${code} copied! Applied automatically on booking.`);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  // Open Service Detail Drawer
  const openServiceDetails = (service: AppServiceItem) => {
    setSelectedService(service);
    setDrawerOpen(true);
  };

  // Quick Book Action
  const handleBookNow = (serviceId: string, taskTitle?: string) => {
    setDrawerOpen(false);
    let url = `/book?service=${encodeURIComponent(serviceId)}`;
    if (taskTitle) {
      url += `&task=${encodeURIComponent(taskTitle)}`;
    }
    navigate(url);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-28 md:pb-16 antialiased">
      {/* ── MOBILE APP STICKY TOP BAR ─────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/40 shadow-sm transition-all">
        <div className="container max-w-4xl mx-auto px-4 pt-3 pb-2.5">
          {/* Top Row: Location Chip + Active Pros Badge */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <button
              onClick={() => setLocationDrawerOpen(true)}
              className="flex items-center gap-1.5 text-left group py-0.5 max-w-[70%] active:scale-[0.98] transition-transform"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <MapPin className="w-3.5 h-3.5 text-primary animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Location</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
                  {selectedLocation}
                </p>
              </div>
            </button>

            {/* Live Verified Pros Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="hidden xs:inline">45+ Pros</span>
              <span>Available</span>
            </div>
          </div>

          {/* Search Box (App-Style Rounded Input) */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search 'fan repair', 'tap leak', 'AC deep clean'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-secondary/70 hover:bg-secondary/90 focus:bg-white text-foreground placeholder:text-muted-foreground/80 text-xs sm:text-sm border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleVoiceSearch}
                className="p-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-90 transition-all"
                title="Voice Search"
                aria-label="Voice Search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Trending Search Tags Rail (Horizontal Swipe) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 pb-0.5 -mx-1 px-1">
            <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap mr-0.5">
              Popular:
            </span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const cleanedTag = tag.replace(/^[^\w\s]+/, '').trim();
                  setSearchQuery(cleanedTag);
                }}
                className={`text-[11px] whitespace-nowrap px-2.5 py-0.5 rounded-full border transition-all active:scale-95 ${searchQuery.toLowerCase().includes(tag.replace(/^[^\w\s]+/, '').trim().toLowerCase())
                    ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                    : 'bg-white/90 text-foreground/80 border-border/60 hover:border-primary/40'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 pt-3.5">
        {/* ── APP PROMO CAROUSEL / FIRST BOOKING DISCOUNT ───────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-accent p-3.5 sm:p-4 text-white shadow-md mb-4 animate-fade-in-up">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Limited Time Offer
                  </span>
                  <span className="text-[11px] text-white/80">⚡ Flat ₹100 OFF</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold mt-0.5 text-white">
                  Save on your first home repair!
                </h4>
              </div>
            </div>

            <button
              onClick={() => handleCopyCoupon('FIRST100')}
              className="flex items-center gap-1.5 bg-white text-foreground hover:bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              {copiedCoupon ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-primary" />
                  <span>FIRST100</span>
                </>
              )}
            </button>
          </div>

          {/* Guarantee Badges Strip */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/15 text-center text-[10px] text-white/90">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-white/90" />
              <span>30-Day Warranty</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-white/90" />
              <span>Verified Experts</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-white/90" />
              <span>Pay After Job</span>
            </div>
          </div>
        </div>

        {/* ── HORIZONTAL CATEGORIES RAIL (Urban Company Style) ─────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Explore Categories
            </h2>
            <span className="text-[11px] text-primary font-semibold">
              {allServices.length} Services Available
            </span>
          </div>

          <div className="flex items-start gap-3 overflow-x-auto no-scrollbar py-1 -mx-2 px-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-1.5 min-w-[68px] sm:min-w-[76px] transition-all duration-200 active:scale-95 focus:outline-none`}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm relative ${isSelected
                        ? `bg-gradient-to-br ${cat.color} text-white shadow-lg ring-2 ring-primary ring-offset-2 scale-105`
                        : 'bg-card text-foreground/80 border border-border/60 hover:border-primary/40'
                      }`}
                  >
                    <Icon className={`w-6 h-6 transition-transform ${isSelected ? 'scale-110' : ''}`} />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs text-center font-medium leading-tight line-clamp-1 transition-colors ${isSelected ? 'text-primary font-bold' : 'text-muted-foreground'
                      }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FILTER CHIPS & VIEW SWITCHER BAR ─────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'popular', label: '🔥 Popular' },
              { id: 'under250', label: '⚡ Under ₹250' },
              { id: 'topRated', label: '⭐ 4.8+ Rated' },
              { id: 'express', label: '⏱️ Express 30m' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap active:scale-95 font-medium ${activeFilter === f.id
                    ? 'bg-foreground text-white border-foreground shadow-xs font-bold'
                    : 'bg-white text-muted-foreground border-border/60 hover:text-foreground hover:bg-slate-50'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List vs Grid Mode Toggle */}
          <div className="flex items-center bg-card border border-border/60 rounded-xl p-0.5 shadow-xs flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="List View"
              aria-label="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── SERVICES LIST / GRID SECTION ─────────────────────────────────── */}
        {loading ? (
          /* Mobile Skeleton Shimmer Loader */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-4 border border-border/50 shadow-xs animate-pulse flex gap-3"
              >
                <div className="w-24 h-24 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                  <div className="h-6 bg-slate-200 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          /* Empty State */
          <div className="bg-card rounded-3xl p-8 border border-border/50 text-center my-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-3 flex items-center justify-center text-muted-foreground">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              No services found for "{searchQuery}"
            </h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              We couldn't find an exact match. Try checking your spelling or choose a popular service below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveFilter('all');
                }}
                className="btn-primary text-xs py-2 px-4 rounded-xl"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setSearchQuery('electrician')}
                className="px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-muted"
              >
                Try Electrician
              </button>
              <button
                onClick={() => setSearchQuery('plumber')}
                className="px-3 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-muted"
              >
                Try Plumber
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* ── MOBILE LIST VIEW (Rich, Informative Cards) ──────────────────── */
          <div className="space-y-3">
            {filteredServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-card rounded-2xl p-3 sm:p-4 border border-border/60 shadow-xs hover:shadow-md transition-all duration-300 animate-fade-in-up group relative overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex gap-3 sm:gap-4">
                    {/* Thumbnail with Gradient Icon Badge */}
                    <div
                      onClick={() => openServiceDetails(service)}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group-hover:opacity-95"
                    >
                      <img
                        src={service.image}
                        alt={getName(service)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div
                        className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute bottom-1 left-1.5 right-1.5">
                        <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-md inline-block">
                          {service.badge}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Title & Rating */}
                        <div className="flex items-start justify-between gap-1">
                          <div
                            onClick={() => openServiceDetails(service)}
                            className="cursor-pointer"
                          >
                            <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                              {getName(service)}
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {service.name_en !== getName(service) ? service.name_en : 'Doorstep Service'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg text-amber-700 text-xs font-bold flex-shrink-0">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{service.rating}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({service.reviews_count})
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {service.desc}
                        </p>

                        {/* ETA & Warranty Micro Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            <Clock className="w-2.5 h-2.5" />
                            {service.eta}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            30d Warranty
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/40">
                        <div>
                          <span className="text-[10px] text-muted-foreground block leading-none">
                            Starts from
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-foreground">
                            ₹{service.starting_price}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openServiceDetails(service)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-border hover:bg-secondary text-foreground active:scale-95 transition-all"
                          >
                            Rate Card
                          </button>
                          <button
                            onClick={() => handleBookNow(service.id)}
                            className="btn-accent text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            Book Now
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── MOBILE GRID VIEW (Compact 2-Column App Grid) ────────────────── */
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {filteredServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/60 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => openServiceDetails(service)}
                >
                  <div className="relative">
                    <AspectRatio ratio={4 / 3}>
                      <img
                        src={service.image}
                        alt={getName(service)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </AspectRatio>

                    {/* Price Pill */}
                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs text-foreground text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                      ₹{service.starting_price}+
                    </div>

                    {/* Gradient Icon Badge */}
                    <div
                      className={`absolute bottom-2 left-2 w-7 h-7 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          ★ {service.rating}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {service.eta}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {getName(service)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {service.desc}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        ₹{service.starting_price}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow(service.id);
                        }}
                        className="text-[11px] font-bold text-primary hover:text-accent flex items-center gap-0.5"
                      >
                        Book <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── NEED HELP / EMERGENCY ASSISTANCE BANNER ──────────────────────── */}
        <div className="mt-8 rounded-2xl bg-secondary/80 border border-border/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Need Instant Emergency Assistance?
              </h4>
              <p className="text-xs text-muted-foreground">
                Our support team and on-call technicians are ready to help 24/7.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="tel:+919152106425"
              className="flex-1 sm:flex-none btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold"
            >
              <Phone className="w-3.5 h-3.5" /> Call Now
            </a>
            <a
              href="https://wa.me/919152106425"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none btn-whatsapp text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── NATIVE MOBILE BOTTOM SHEET (SERVICE DETAILS & RATE CARD) ──────── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[92vh] max-w-lg mx-auto overflow-hidden flex flex-col rounded-t-[28px] border-t border-border bg-card shadow-2xl">
          {selectedService && (
            <>
              {/* Drawer Top Grab Handle */}
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 flex-shrink-0" />

              {/* Scrollable Sheet Content */}
              <div className="overflow-y-auto flex-1 px-4 pt-3 pb-6 no-scrollbar">
                {/* Hero Header */}
                <div className="relative rounded-2xl overflow-hidden mb-3">
                  <AspectRatio ratio={16 / 9}>
                    <img
                      src={selectedService.image}
                      alt={getName(selectedService)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </AspectRatio>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedService.badge}
                      </span>
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full text-xs font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{selectedService.rating}</span>
                        <span className="text-[10px] text-white/80 font-normal">
                          ({selectedService.reviews_count} reviews)
                        </span>
                      </div>
                    </div>
                    <h2 className="text-xl font-extrabold text-white leading-tight">
                      {getName(selectedService)}
                    </h2>
                    <p className="text-xs text-white/80 mt-0.5">
                      {selectedService.desc}
                    </p>
                  </div>
                </div>

                {/* 3 Pillars of LocalFix Assurance */}
                <div className="grid grid-cols-3 gap-2 py-2 mb-4 bg-secondary/50 rounded-2xl p-2.5 border border-border/50 text-center">
                  <div className="p-1">
                    <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
                    <span className="block text-[11px] font-bold text-foreground">
                      {selectedService.eta}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Doorstep Arrival</span>
                  </div>
                  <div className="p-1 border-x border-border/60">
                    <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <span className="block text-[11px] font-bold text-foreground">
                      30-Day Free
                    </span>
                    <span className="text-[10px] text-muted-foreground">Rework Warranty</span>
                  </div>
                  <div className="p-1">
                    <CheckCircle className="w-4 h-4 mx-auto text-accent mb-1" />
                    <span className="block text-[11px] font-bold text-foreground">
                      Zero Advance
                    </span>
                    <span className="text-[10px] text-muted-foreground">Pay After Fix</span>
                  </div>
                </div>

                {/* Popular Tasks & Transparent Rate Card */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Popular Rate Card & Tasks
                    </h3>
                    <span className="text-[11px] text-muted-foreground">Upfront Fixed Rates</span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedService.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="bg-card rounded-xl p-3 border border-border/70 hover:border-primary/50 shadow-xs flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-foreground">
                              {pkg.title}
                            </h4>
                            {pkg.popular && (
                              <span className="bg-amber-500/10 text-amber-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {pkg.desc}
                          </p>
                          <span className="text-[10px] text-primary font-semibold flex items-center gap-1 mt-1">
                            <Clock className="w-2.5 h-2.5" /> Est. {pkg.time}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-xs sm:text-sm font-extrabold text-foreground mb-1">
                            {pkg.price === 0 ? 'Free' : `₹${pkg.price}`}
                          </div>
                          <button
                            onClick={() => handleBookNow(selectedService.id, pkg.title)}
                            className="btn-accent text-[11px] font-bold py-1 px-3 rounded-lg shadow-xs"
                          >
                            Book This
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What's Included Checklist */}
                <div className="bg-secondary/40 rounded-2xl p-3.5 border border-border/50 mb-4">
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    What is Included with NearMitra?
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedService.included.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Customer Review Snippet */}
                <div className="rounded-2xl border border-border/50 p-3 bg-white mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                        R
                      </div>
                      <span className="text-xs font-bold text-foreground">Rahul S.</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                        Verified Order
                      </span>
                    </div>
                    <div className="text-amber-500 text-xs">★★★★★</div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    "Super quick doorstep response! The technician was polite, brought his own tools, and fixed our problem within 30 minutes without extra charges."
                  </p>
                </div>
              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="p-3.5 border-t border-border/70 bg-card/95 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg flex-shrink-0">
                <div>
                  <span className="text-[10px] text-muted-foreground block leading-none">
                    Starting from
                  </span>
                  <span className="text-base font-extrabold text-foreground">
                    ₹{selectedService.starting_price}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DrawerClose asChild>
                    <button className="px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-secondary">
                      Close
                    </button>
                  </DrawerClose>
                  <button
                    onClick={() => handleBookNow(selectedService.id)}
                    className="btn-accent text-xs font-bold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    Proceed to Book
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ── LOCATION SELECTOR BOTTOM SHEET ──────────────────────────────── */}
      <Drawer open={locationDrawerOpen} onOpenChange={setLocationDrawerOpen}>
        <DrawerContent className="max-h-[70vh] max-w-md mx-auto overflow-hidden flex flex-col rounded-t-[28px] border-t border-border bg-card">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 flex-shrink-0" />
          <div className="p-4 border-b border-border/60">
            <h3 className="font-bold text-sm text-foreground">Select Your Service Area</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose your locality for real-time technician availability
            </p>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto no-scrollbar">
            {LOCATIONS.map((loc) => {
              const isSelected = selectedLocation === loc;
              return (
                <button
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    localStorage.setItem('nearmitra_user_location', loc);
                    setLocationDrawerOpen(false);
                    toast.success(`Location updated to ${loc}`);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs sm:text-sm font-medium ${isSelected
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'border-border hover:bg-secondary text-foreground'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{loc}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-border bg-secondary/50 text-center">
            <DrawerClose asChild>
              <button className="text-xs text-muted-foreground font-semibold hover:underline">
                Cancel
              </button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Services;
