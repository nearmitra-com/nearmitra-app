import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Check, Loader2, Sparkles } from 'lucide-react';
import { GeoLocation, CITY_PRESETS, reverseGeocode, DEFAULT_COORDS, getUserDeviceLocation } from '@/lib/geoUtils';
import { NearbyProviderMap } from './NearbyProviderMap';

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCoords?: GeoLocation;
  onLocationSelect: (location: GeoLocation) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  open,
  onOpenChange,
  initialCoords,
  onLocationSelect,
}) => {
  const [coords, setCoords] = useState<GeoLocation>(initialCoords || DEFAULT_COORDS);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(coords.address || '');

  // Keep coords in sync if modal opens with different initialCoords
  useEffect(() => {
    if (initialCoords && open) {
      setCoords(initialCoords);
      setResolvedAddress(initialCoords.address || '');
    }
  }, [initialCoords, open]);

  // When coords change, reverse geocode to friendly address
  const handleCoordsChange = async (newCoords: GeoLocation) => {
    setCoords(newCoords);
    setIsGeocoding(true);
    try {
      const addr = await reverseGeocode(newCoords.lat, newCoords.lng);
      setResolvedAddress(addr);
      setCoords((prev) => ({ ...prev, address: addr, label: addr.split(',')[0] }));
    } catch {
      // keep fallback
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    try {
      const detected = await getUserDeviceLocation();
      setCoords(detected);
      setResolvedAddress(detected.address || detected.label || '');
    } catch (err) {
      console.warn('GPS error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      ...coords,
      address: resolvedAddress || coords.address || `${coords.lat}, ${coords.lng}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-border bg-card">
        <DialogHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              Pinpoint Your Service Address
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Drag the pin or click anywhere on the map to mark your exact doorstep for the technician.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Toolbar */}
        <div className="px-5 pb-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="text-xs h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            {isDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            Detect Current Location
          </Button>

          {/* Quick city selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {CITY_PRESETS.slice(0, 4).map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() =>
                  handleCoordsChange({
                    lat: city.lat,
                    lng: city.lng,
                    label: city.name,
                    address: `${city.name}, ${city.state}`,
                  })
                }
                className="px-2 py-1 rounded-md bg-secondary text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap transition-colors"
              >
                {city.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative px-5">
          <NearbyProviderMap
            customerCoords={coords}
            onCustomerCoordsChange={handleCoordsChange}
            providers={[]}
            selectedProviderId={null}
            onSelectProvider={() => {}}
            radiusKm={5}
            height="320px"
            allowDragCustomerPin={true}
          />
        </div>

        {/* Resolved Address Summary */}
        <div className="p-5 pt-3 space-y-3">
          <div className="p-3 rounded-xl bg-muted/60 border border-border/80 text-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Selected Location:
              </span>
              {isGeocoding && (
                <span className="flex items-center gap-1 text-[10px] text-primary animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
                </span>
              )}
            </div>
            <p className="text-foreground font-medium line-clamp-2">
              {resolvedAddress || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
            </p>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="bg-primary text-primary-foreground font-semibold gap-1.5 px-5"
            >
              <Check className="w-4 h-4" />
              Confirm Location
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
