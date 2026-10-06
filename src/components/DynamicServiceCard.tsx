import { Link } from 'react-router-dom';
import {
  Zap, Hammer, Droplets, Paintbrush, Wind, Sparkles, Wrench,
  Settings, Shield, Home, Car, Star, Package, ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// ── Local image assets for known services ───────────────────────────────────
import electricianImg from '@/assets/service-electrician.jpg';
import carpenterImg   from '@/assets/service-carpenter.jpg';
import plumberImg     from '@/assets/service-plumber.jpg';
import painterImg     from '@/assets/service-painter.jpg';
import acImg          from '@/assets/service-ac.jpg';
import cleaningImg    from '@/assets/service-cleaning.jpg';
import maidImg        from '@/assets/service-maid.jpg';

interface DynamicService {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  icon: string;
  starting_price: number;
  is_active: boolean;
}

interface DynamicServiceCardProps {
  service: DynamicService;
  showBookButton?: boolean;
}

// ── Map icon string names → Lucide components ────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Zap, Hammer, Droplets, Paintbrush, Wind, Sparkles, Wrench,
  Settings, Shield, Home, Car, Star, Package,
  Electrician: Zap, Plumber: Droplets, Carpenter: Hammer,
  Painter: Paintbrush, AC: Wind, Cleaning: Sparkles,
};

// ── Map well-known service names → local images ──────────────────────────────
const imageMap: Record<string, string> = {
  electrician:   electricianImg,
  carpenter:     carpenterImg,
  plumber:       plumberImg,
  painter:       painterImg,
  'ac repair':   acImg,
  acrepair:      acImg,
  cleaning:      cleaningImg,
  maid:          maidImg,
  housemaid:     maidImg,
  'house maid':  maidImg,
  housekeeping:  maidImg,
  housekeeper:   maidImg,
};

function getImage(name_en: string): string | null {
  return imageMap[name_en.toLowerCase().replace(/\s+/g, ' ').trim()] ?? null;
}

// ── Gradient palette for cards without images ─────────────────────────
const gradientPalette = [
  'from-amber-500 to-orange-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-green-600',
  'from-orange-500 to-red-600',
  'from-indigo-500 to-blue-600',
];
function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return gradientPalette[Math.abs(hash) % gradientPalette.length];
}

export const DynamicServiceCard = ({ service, showBookButton = false }: DynamicServiceCardProps) => {
  const { language } = useLanguage();

  const name =
    language === 'hi' ? service.name_hi || service.name_en
    : language === 'mr' ? service.name_mr || service.name_en
    : service.name_en;

  const IconComponent = iconMap[service.icon] ?? Wrench;
  const image = getImage(service.name_en);
  const gradient = getGradient(service.id);

  return (
    <div className="service-card group overflow-hidden">
      {/* ── Image (if local asset exists) ──────────────────────────────────── */}
      {image ? (
        <div className="relative -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl">
          <AspectRatio ratio={4 / 3}>
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </AspectRatio>
          <div className={`absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        </div>
      ) : (
        /* ── Icon-only fallback for new/custom services ─────────────────── */
        <div className="flex flex-col items-center mb-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <IconComponent className="w-8 h-8 text-white" />
          </div>
        </div>
      )}

      {/* ── Card body ──────────────────────────────────────────────────────── */}
      <div className={`flex flex-col ${image ? '' : 'items-center text-center'}`}>
        <h3 className="font-bold text-base text-foreground mb-1">{name}</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Starting from <span className="font-bold text-foreground">₹{service.starting_price}</span>
        </p>
        {showBookButton && (
          <Link
            to={`/book?service=${service.id}`}
            className="btn-accent w-full text-center text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 group/btn"
          >
            Book Now
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
};
