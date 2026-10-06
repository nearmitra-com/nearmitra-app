import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ServiceCardProps {
  id: string;
  nameKey: keyof typeof translations['en'];
  icon: LucideIcon;
  price: number;
  color: string;
  image?: string;
  showBookButton?: boolean;
}

const colorClasses: Record<string, string> = {
  'service-electric': 'bg-service-electric',
  'service-wood': 'bg-service-wood',
  'service-water': 'bg-service-water',
  'service-paint': 'bg-service-paint',
  'service-cool': 'bg-service-cool',
  'service-clean': 'bg-service-clean',
};

export const ServiceCard = ({
  id,
  nameKey,
  icon: Icon,
  price,
  color,
  image,
  showBookButton = false
}: ServiceCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="service-card group overflow-hidden">
      {image && (
        <div className="relative -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl">
          <AspectRatio ratio={4 / 3}>
            <img
              src={image}
              alt={t(nameKey)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </AspectRatio>
          <div className={`absolute bottom-3 left-3 w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <div className={`flex flex-col ${image ? '' : 'items-center text-center'}`}>
        {!image && (
          <div className={`w-16 h-16 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}
        <h3 className="font-semibold text-lg text-foreground mb-1">
          {t(nameKey)}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {t('startingFrom')} <span className="font-bold text-foreground">₹{price}</span>
        </p>
        {showBookButton && (
          <Link
            to={`/book?service=${id}`}
            className="btn-accent w-full text-center text-sm py-2"
          >
            {t('bookNow')}
          </Link>
        )}
      </div>
    </div>
  );
};
