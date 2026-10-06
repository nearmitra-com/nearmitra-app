import { IndianRupee, TrendingUp, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface EarningsCardProps {
  totalEarnings: number;
  monthlyEarnings: number;
  jobsCompleted: number;
  monthlyJobs: number;
}

export const EarningsCard = ({
  totalEarnings,
  monthlyEarnings,
  jobsCompleted,
  monthlyJobs,
}: EarningsCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <Card className="bg-gradient-to-br from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/20 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-[hsl(var(--success))]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{t('totalEarnings')}</p>
          <p className="text-xs text-[hsl(var(--success))] mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            ₹{monthlyEarnings.toLocaleString()} {t('thisMonth')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{jobsCompleted}</p>
          <p className="text-xs text-muted-foreground">{t('jobsCompleted')}</p>
          <p className="text-xs text-primary mt-1">
            {monthlyJobs} {t('thisMonth')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
