import { User, Phone, MapPin, Calendar, Briefcase, CheckCircle, Wrench } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProviderStats {
  totalAssigned: number;
  totalCompleted: number;
  earnings: number;
}

interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  skills: string[];
  is_available: boolean;
  is_approved: boolean;
  approved_at?: string;
  approved_by?: string;
  address: string;
  created_at?: string;
}

interface ProviderDetailsDialogProps {
  provider: Provider | null;
  stats: ProviderStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProviderDetailsDialog = ({
  provider,
  stats,
  open,
  onOpenChange,
}: ProviderDetailsDialogProps) => {
  const { t } = useLanguage();

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t('providerDetails')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Info */}
          <div className="text-center pb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{provider.full_name}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${provider.is_available
                ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                : 'bg-destructive/10 text-destructive'
              }`}>
              {provider.is_available ? t('available') : t('unavailable')}
            </span>
          </div>

          <Separator />

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Briefcase className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.totalAssigned || 0}</p>
                <p className="text-[10px] text-muted-foreground">{t('totalJobsAssigned')}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.totalCompleted || 0}</p>
                <p className="text-[10px] text-muted-foreground">{t('totalJobsCompleted')}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <span className="text-primary text-lg font-bold block mb-1">₹</span>
                <p className="text-lg font-bold">{(stats?.earnings || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{t('totalEarnings')}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">{t('contactInfo')}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{provider.phone}</span>
              </div>
              {provider.address && (
                <div className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{provider.address}</span>
                </div>
              )}
              {provider.created_at && (
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {t('registeredOn')}: {new Date(provider.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {provider.skills && provider.skills.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  {t('serviceSpecialty')}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {provider.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button onClick={() => onOpenChange(false)} className="w-full mt-4">
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
