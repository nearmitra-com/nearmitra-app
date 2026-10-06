import { Clock, MapPin, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompletedJob {
  id: string;
  customer_name: string;
  address: string;
  service_name: string;
  completed_at: string;
  earning: number;
}

interface WorkHistoryCardProps {
  job: CompletedJob;
}

export const WorkHistoryCard = ({ job }: WorkHistoryCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-[hsl(var(--success))] flex-shrink-0" />
              <span className="font-semibold text-foreground truncate">
                {job.customer_name}
              </span>
            </div>
            <p className="text-sm text-primary font-medium mb-1">{job.service_name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{job.address}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{new Date(job.completed_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-[hsl(var(--success))]">
              ₹{job.earning}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
