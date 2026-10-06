import { Zap, Hammer, Droplets, Paintbrush, Wind, Sparkles } from 'lucide-react';
import electricianImg from '@/assets/service-electrician.jpg';
import carpenterImg from '@/assets/service-carpenter.jpg';
import plumberImg from '@/assets/service-plumber.jpg';
import painterImg from '@/assets/service-painter.jpg';
import acRepairImg from '@/assets/service-ac.jpg';
import cleaningImg from '@/assets/service-cleaning.jpg';

export const services = [
  {
    id: 'electrician',
    nameKey: 'electrician' as const,
    icon: Zap,
    price: 199,
    color: 'service-electric',
    image: electricianImg,
  },
  {
    id: 'carpenter',
    nameKey: 'carpenter' as const,
    icon: Hammer,
    price: 249,
    color: 'service-wood',
    image: carpenterImg,
  },
  {
    id: 'plumber',
    nameKey: 'plumber' as const,
    icon: Droplets,
    price: 199,
    color: 'service-water',
    image: plumberImg,
  },
  {
    id: 'painter',
    nameKey: 'painter' as const,
    icon: Paintbrush,
    price: 299,
    color: 'service-paint',
    image: painterImg,
  },
  {
    id: 'acRepair',
    nameKey: 'acRepair' as const,
    icon: Wind,
    price: 349,
    color: 'service-cool',
    image: acRepairImg,
  },
  {
    id: 'cleaning',
    nameKey: 'cleaning' as const,
    icon: Sparkles,
    price: 499,
    color: 'service-clean',
    image: cleaningImg,
  },
];

