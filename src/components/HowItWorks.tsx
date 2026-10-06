import { MousePointer, Calendar, Wrench, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: MousePointer,
      titleKey: 'step1Title' as const,
      descKey: 'step1Desc' as const,
      gradient: 'from-[hsl(189,69%,34%)] to-[hsl(189,69%,24%)]',
      bg: 'bg-primary/8',
    },
    {
      icon: Calendar,
      titleKey: 'step2Title' as const,
      descKey: 'step2Desc' as const,
      gradient: 'from-[hsl(24,92%,56%)] to-[hsl(24,92%,44%)]',
      bg: 'bg-accent/8',
    },
    {
      icon: Wrench,
      titleKey: 'step3Title' as const,
      descKey: 'step3Desc' as const,
      gradient: 'from-[hsl(152,69%,40%)] to-[hsl(152,69%,30%)]',
      bg: 'bg-[hsl(152,69%,40%)]/8',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/40 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('howItWorks')}</h2>
          <p className="text-muted-foreground">{t('howItWorksSubtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-8 shadow-sm border border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-400 hover:-translate-y-1"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center shadow-md z-10">
                <span className="font-bold text-sm text-primary">{index + 1}</span>
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-bold text-lg mb-3 text-foreground">{t(step.titleKey)}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descKey)}</p>

              {/* Arrow connector (visible on md+, except last) */}
              {index < 2 && (
                <div className="hidden md:flex absolute top-1/2 -right-4 z-10 w-8 h-8 bg-card border border-border/50 rounded-full items-center justify-center shadow-sm">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
