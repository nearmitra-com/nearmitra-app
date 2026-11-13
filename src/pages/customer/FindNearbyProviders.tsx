import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  Search, 
  ShieldCheck, 
  Star, 
  Clock, 
  Briefcase, 
  SlidersHorizontal, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Phone,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DbProviderProfile } from '@/lib/localDb';
import { 
  GeoLocation, 
  CITY_PRESETS, 
  DEFAULT_COORDS, 
  estimateArrivalTimeMins, 
  reverseGeocode,
  getSavedCustomerLocation,
  saveCustomerLocation,
  getUserDeviceLocation
} from '@/lib/geoUtils';
import { NearbyProviderMap } from '@/components/NearbyProviderMap';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SERVICE_CATEGORIES = [
  { id: 'all', label: 'All Services', icon: '⚡' },
  { id: 'Electrician', label: 'Electrician', icon: '💡' },
  { id: 'Plumber', label: 'Plumber', icon: '🔧' },
  { id: 'AC Repair & Service', label: 'AC Repair', icon: '❄️' },
  { id: 'Deep Cleaning', label: 'Cleaning', icon: '✨' },
  { id: 'Carpenter', label: 'Carpenter', icon: '🪚' },
  { id: 'Painter', label: 'Painter', icon: '🎨' },
  { id: 'House Maid', label: 'House Maid', icon: '🧹' },
];

const RADIUS_OPTIONS = [3, 5, 10, 15, 25];

interface SupabaseWithRpc {
  rpc: (
    name: string,
    params: Record<string, unknown>
  ) => Promise<{ data: (DbProviderProfile & { distance_km?: number })[] | null; error: Error | null }>;
}

export default function FindNearbyProviders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialService = searchParams.get('service') || 'all';

  // Customer Coordinates & Address State
  const [customerCoords, setCustomerCoords] = useState<GeoLocation>(() => {
    return getSavedCustomerLocation();
  });

  const [selectedService, setSelectedService] = useState<string>(initialService);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [providers, setProviders] = useState<(DbProviderProfile & { distance_km?: number })[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const listContainerRef = useRef<HTMLDivElement>(null);

  // Auto-detect real location on initial mount if still using default/preset
  useEffect(() => {
    const saved = getSavedCustomerLocation();
    if (!saved || (saved.lat === DEFAULT_COORDS.lat && saved.lng === DEFAULT_COORDS.lng && saved.accuracySource !== 'search')) {
      getUserDeviceLocation().then((loc) => {
        setCustomerCoords(loc);
      }).catch(() => {});
    }
  }, []);

  // 1. Fetch nearby providers whenever coordinates, radius, or service changes
  const fetchNearby = async (coords: GeoLocation, service: string, radius: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as unknown as SupabaseWithRpc).rpc('get_nearby_providers', {
        user_lat: coords.lat,
        user_lng: coords.lng,
        radius_meters: radius * 1000,
        selected_service: service === 'all' ? '' : service,
      });

      if (!error && Array.isArray(data)) {
        setProviders(data);
      } else {
        console.warn('Error querying nearby providers:', error);
      }
    } catch (err) {
      console.error('Failed to load nearby providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby(customerCoords, selectedService, radiusKm);
    saveCustomerLocation(customerCoords);
  }, [customerCoords, selectedService, radiusKm]);

  // Handle GPS Auto Detect
  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    toast.info('Detecting your live device location...');
    try {
      const loc = await getUserDeviceLocation();
      setCustomerCoords(loc);
      toast.success(`Location set to: ${loc.label || loc.address || 'Current Position'}`);
    } catch (err) {
      console.warn('Geolocation detection error:', err);
      toast.error('Could not get precise GPS location. Please select a city or search your locality.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Handle provider selection
  const handleSelectProvider = (provider: DbProviderProfile | null) => {
    setSelectedProviderId(provider ? provider.id : null);
    if (provider && listContainerRef.current) {
      const cardEl = document.getElementById(`provider-card-${provider.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Direct Book Provider Action
  const handleBookProvider = (provider: DbProviderProfile) => {
    const serviceName = provider.skills && provider.skills[0] ? provider.skills[0] : selectedService !== 'all' ? selectedService : 'serv-electrician';
    const params = new URLSearchParams({
      service: serviceName,
      providerId: provider.id,
      providerName: provider.full_name,
      address: customerCoords.address || customerCoords.label || '',
      lat: String(customerCoords.lat),
      lng: String(customerCoords.lng),
    });
    navigate(`/book?${params.toString()}`);
  };

  // Filtered providers by search text if user typed in quick search
  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [providers, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-12">
      {/* ── TOP HEADER / BREADCRUMB ───────────────────────── */}
      <div className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-14 md:top-16 z-30">
        <div className="container mx-auto px-4 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium">Hyperlocal Providers Map</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Find Nearby Service Providers</span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live GPS Matching
                </span>
              </h1>
            </div>

            {/* Quick GPS & Address Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="gap-1.5 text-xs h-9 border-primary/40 text-primary hover:bg-primary/10 shadow-xs"
              >
                <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Locating...' : 'Locate Me'}</span>
              </Button>

              <div className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border text-xs max-w-xs truncate">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate font-medium text-foreground">
                  {customerCoords.label || customerCoords.address || 'Selected Location'}
                </span>
              </div>
            </div>
          </div>

          {/* ── CITY PRESETS BAR ────────────────────────────── */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-border/40 mt-3">
            <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap mr-1 flex items-center gap-1">
              Popular Hubs:
            </span>
            {CITY_PRESETS.map((city) => {
              const isSelected =
                Math.abs(customerCoords.lat - city.lat) < 0.02 &&
                Math.abs(customerCoords.lng - city.lng) < 0.02;

              return (
                <button
                  key={city.name}
                  onClick={() => {
                    setCustomerCoords({
                      lat: city.lat,
                      lng: city.lng,
                      label: city.name,
                      address: `${city.name}, ${city.state}`,
                    });
                    toast.success(`Switched search area to ${city.name}`);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {city.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FILTER TOOLBAR: SERVICES & RADIUS ─────────────── */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm mb-5 space-y-3">
          {/* Service Selector Pills */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Select Required Service
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedService === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedService(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-102'
                        : 'bg-secondary/60 hover:bg-secondary text-foreground border-border/60 hover:border-border'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Search + Radius Slider */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
            {/* Quick search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search technician name, area or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Radius Pills */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Search Radius:
              </span>
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                      radiusKm === r
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT: SPLIT VIEW (MAP + LIST) ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: INTERACTIVE MAP (7 cols on lg) */}
          <div className="lg:col-span-7 sticky top-36 z-10">
            <div className="space-y-2">
              <NearbyProviderMap
                customerCoords={customerCoords}
                onCustomerCoordsChange={(newCoords) => setCustomerCoords(newCoords)}
                providers={filteredProviders}
                selectedProviderId={selectedProviderId}
                onSelectProvider={handleSelectProvider}
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                onBookProvider={handleBookProvider}
                height="560px"
                allowDragCustomerPin={true}
              />

              <div className="p-3 rounded-xl bg-card border border-border/60 text-xs flex items-center justify-between gap-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  <span>Blue: Your Pin</span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block ml-2" />
                  <span>Green: Verified Pros</span>
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block ml-2" />
                  <span>Orange: Selected</span>
                </div>
                <span className="font-semibold text-foreground">
                  {filteredProviders.length} Active in Radius
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PROVIDER LIST CARDS (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4" ref={listContainerRef}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Available Technicians ({filteredProviders.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Sorted by closest driving distance to your pin
                </p>
              </div>

              {isLoading && (
                <span className="text-xs text-primary font-medium animate-pulse">
                  Updating radar...
                </span>
              )}
            </div>

            {/* Empty State */}
            {!isLoading && filteredProviders.length === 0 && (
              <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/80">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">
                  No verified providers found within {radiusKm} km
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">
                  Try expanding your search radius to 15km or 25km, or select "All Services" to see all nearby technicians.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRadiusKm(25)}
                    className="text-xs"
                  >
                    Expand to 25 km
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedService('all')}
                    className="text-xs"
                  >
                    Show All Services
                  </Button>
                </div>
              </div>
            )}

            {/* Provider Cards List */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredProviders.map((provider) => {
                const isSelected = provider.id === selectedProviderId;
                const distanceKm = provider.distance_km ?? 2.5;
                const etaMins = estimateArrivalTimeMins(distanceKm);

                return (
                  <div
                    key={provider.id}
                    id={`provider-card-${provider.id}`}
                    onClick={() => handleSelectProvider(provider)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-card border-primary ring-2 ring-primary/20 shadow-lg scale-[1.01]'
                        : 'bg-card/70 hover:bg-card border-border/70 hover:border-border hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              provider.avatar_url ||
                              'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&auto=format&fit=crop&q=80'
                            }
                            alt={provider.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-border shadow-xs"
                          />
                          <div
                            className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs"
                            title="Government ID & Background Verified"
                          >
                            <ShieldCheck className="w-3 h-3" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-foreground">
                              {provider.full_name}
                            </h3>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                              Verified Pro
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-0.5 font-bold text-amber-500">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {provider.rating || 4.9}
                            </span>
                            <span>•</span>
                            <span>{provider.completed_jobs || 120}+ completed jobs</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance Badge */}
                      <div className="text-right flex-shrink-0">
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-xs">
                          {distanceKm} km away
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          ⏱️ ~{etaMins} mins ETA
                        </span>
                      </div>
                    </div>

                    {/* Address & Skills */}
                    <div className="text-xs text-muted-foreground mb-3 space-y-1">
                      <p className="line-clamp-1">
                        📍 {provider.address}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {provider.skills?.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                          Inspection & Visit
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          ₹{provider.hourly_rate || 249} Starting
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProvider(provider);
                          }}
                          className="text-xs h-8 px-3"
                        >
                          View Pin
                        </Button>

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookProvider(provider);
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 px-4 gap-1 shadow-xs"
                        >
                          <span>Book Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
