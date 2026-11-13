import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF } from '@react-google-maps/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  ShieldCheck, 
  Star, 
  Clock, 
  Sparkles, 
  Crosshair, 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2,
  Search,
  Loader2,
  X,
  Compass,
  CheckCircle2,
  SlidersHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  GeoLocation, 
  calculateHaversineDistanceKm, 
  estimateArrivalTimeMins, 
  searchLocations,
  getUserDeviceLocation,
  reverseGeocode
} from '@/lib/geoUtils';
import { 
  GOOGLE_MAPS_LIBRARIES, 
  GOOGLE_MAPS_SCRIPT_ID, 
  getGoogleMapsApiKey, 
  hasValidGoogleMapsApiKey, 
  GOOGLE_MAPS_DARK_STYLES 
} from '@/lib/googleMapsConfig';
import { DbProviderProfile } from '@/lib/localDb';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface NearbyProviderMapProps {
  customerCoords: GeoLocation;
  onCustomerCoordsChange: (newCoords: GeoLocation) => void;
  providers: (DbProviderProfile & { distance_km?: number })[];
  selectedProviderId: string | null;
  onSelectProvider: (provider: DbProviderProfile | null) => void;
  radiusKm: number;
  onRadiusChange?: (radiusKm: number) => void;
  onBookProvider?: (provider: DbProviderProfile) => void;
  height?: string;
  allowDragCustomerPin?: boolean;
}

type MapLayerType = 'streets' | 'satellite' | 'dark' | 'terrain';

const LEAFLET_TILE_LAYERS: Record<MapLayerType, { url: string; name: string; icon: string; maxZoom: number }> = {
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    name: 'Streets',
    icon: '🗺️',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite',
    icon: '🛰️',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    name: 'Dark Mode',
    icon: '🌙',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    name: 'Terrain',
    icon: '🏔️',
    maxZoom: 19,
  },
};

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

export const NearbyProviderMap: React.FC<NearbyProviderMapProps> = ({
  customerCoords,
  onCustomerCoordsChange,
  providers,
  selectedProviderId,
  onSelectProvider,
  radiusKm,
  onRadiusChange,
  onBookProvider,
  height = '500px',
  allowDragCustomerPin = true,
}) => {
  const apiKey = getGoogleMapsApiKey();
  const hasKey = hasValidGoogleMapsApiKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: hasKey ? apiKey : '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [preferredEngine, setPreferredEngine] = useState<'google' | 'leaflet'>('google');

  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId) || null;
  }, [providers, selectedProviderId]);

  // Use Google Maps if key is loaded and no error, else fallback to Leaflet
  const shouldUseGoogle = isLoaded && !loadError && preferredEngine === 'google';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border/80 shadow-xl bg-card" style={{ height }}>
      {shouldUseGoogle ? (
        <GoogleInteractiveNearbyMapView
          customerCoords={customerCoords}
          onCustomerCoordsChange={onCustomerCoordsChange}
          providers={providers}
          selectedProvider={selectedProvider}
          onSelectProvider={onSelectProvider}
          radiusKm={radiusKm}
          onRadiusChange={onRadiusChange}
          onBookProvider={onBookProvider}
          allowDragCustomerPin={allowDragCustomerPin}
          onToggleEngine={() => setPreferredEngine('leaflet')}
        />
      ) : (
        <LeafletRealStreetMapView
          customerCoords={customerCoords}
          onCustomerCoordsChange={onCustomerCoordsChange}
          providers={providers}
          selectedProvider={selectedProvider}
          onSelectProvider={onSelectProvider}
          radiusKm={radiusKm}
          onRadiusChange={onRadiusChange}
          onBookProvider={onBookProvider}
          allowDragCustomerPin={allowDragCustomerPin}
          isGoogleAvailable={isLoaded && !loadError}
          onToggleEngine={() => setPreferredEngine('google')}
        />
      )}
    </div>
  );
};

// ─── GOOGLE MAPS INTERACTIVE VIEW ──────────────────────────────────────────────
interface GoogleInteractiveNearbyMapViewProps {
  customerCoords: GeoLocation;
  onCustomerCoordsChange: (newCoords: GeoLocation) => void;
  providers: (DbProviderProfile & { distance_km?: number })[];
  selectedProvider: (DbProviderProfile & { distance_km?: number }) | null;
  onSelectProvider: (provider: DbProviderProfile | null) => void;
  radiusKm: number;
  onRadiusChange?: (radiusKm: number) => void;
  onBookProvider?: (provider: DbProviderProfile) => void;
  allowDragCustomerPin?: boolean;
  onToggleEngine?: () => void;
}

const GoogleInteractiveNearbyMapView: React.FC<GoogleInteractiveNearbyMapViewProps> = ({
  customerCoords,
  onCustomerCoordsChange,
  providers,
  selectedProvider,
  onSelectProvider,
  radiusKm,
  onRadiusChange,
  onBookProvider,
  allowDragCustomerPin = true,
  onToggleEngine,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  // Map Controls State
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  const [filterTopRatedOnly, setFilterTopRatedOnly] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced Location Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
      } catch (e) {
        console.warn('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search dropdown listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (loc: GeoLocation) => {
    onCustomerCoordsChange(loc);
    setShowSearchDropdown(false);
    setSearchQuery(loc.label || loc.address || '');
    if (mapRef.current) {
      mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
      mapRef.current.setZoom(15);
    }
    toast.success(`Location set to: ${loc.label || 'Selected Location'}`);
  };

  const handleDetectGPS = async () => {
    setIsLocatingDevice(true);
    toast.info('Detecting device location via GPS & Network...');
    try {
      const loc = await getUserDeviceLocation();
      onCustomerCoordsChange(loc);
      if (mapRef.current) {
        mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
        mapRef.current.setZoom(15);
      }
      toast.success(`Found location: ${loc.label || 'Your Current Area'}`);
    } catch (err) {
      console.warn('GPS detection failed:', err);
      toast.error('Unable to retrieve GPS fix. You can drag the blue pin or search your colony.');
    } finally {
      setIsLocatingDevice(false);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: customerCoords.lat, lng: customerCoords.lng });
      mapRef.current.setZoom(14);
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 14) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 14) - 1);
    }
  };

  // Filtered providers
  const visibleProviders = useMemo(() => {
    return providers.filter((p) => {
      if (filterTopRatedOnly && (p.rating || 0) < 4.8) return false;
      const pLat = p.latitude || customerCoords.lat;
      const pLng = p.longitude || customerCoords.lng;
      const dist = calculateHaversineDistanceKm(customerCoords.lat, customerCoords.lng, pLat, pLng);
      return dist <= radiusKm * 1.35;
    });
  }, [providers, filterTopRatedOnly, customerCoords, radiusKm]);

  // Google Map options based on layer
  const mapOptions: google.maps.MapOptions = useMemo(() => {
    let mapTypeId: google.maps.MapTypeId | string = 'roadmap';
    let styles: google.maps.MapTypeStyle[] = [];

    if (activeLayer === 'satellite') {
      mapTypeId = 'hybrid';
    } else if (activeLayer === 'dark') {
      mapTypeId = 'roadmap';
      styles = GOOGLE_MAPS_DARK_STYLES;
    } else if (activeLayer === 'terrain') {
      mapTypeId = 'terrain';
    }

    return {
      mapTypeId,
      styles,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
    };
  }, [activeLayer]);

  // SVG Icons for Google Maps Markers
  const customerSvgIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.google?.maps) return undefined;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="46" height="56" viewBox="0 0 46 56">
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1e3a8a" flood-opacity="0.4"/>
          </filter>
          <g filter="url(#shadow)">
            <path d="M23 0C10.297 0 0 10.297 0 23c0 16.5 23 33 23 33s23-16.5 23-33C46 10.297 35.703 0 23 0z" fill="#2563eb"/>
            <circle cx="23" cy="22" r="18" fill="#ffffff"/>
            <path d="M15 25v-5l8-6 8 6v5a1 1 0 0 1-1 1h-3v-4h-8v4h-3a1 1 0 0 1-1-1z" fill="#2563eb"/>
          </g>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(46, 56),
      anchor: new window.google.maps.Point(23, 56),
    };
  }, []);

  const getProviderSvgIcon = (rating?: number, isSelected?: boolean) => {
    if (typeof window === 'undefined' || !window.google?.maps) return undefined;
    const bgFill = isSelected ? '#ea580c' : '#059669';
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54">
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
          </filter>
          <g filter="url(#shadow)">
            <path d="M22 0C9.85 0 0 9.85 0 22c0 15.5 22 32 22 32s22-16.5 22-32C44 9.85 34.15 0 22 0z" fill="${bgFill}"/>
            <circle cx="22" cy="20" r="16" fill="#ffffff"/>
            <text x="22" y="24" font-size="11" font-weight="900" font-family="system-ui, sans-serif" fill="${bgFill}" text-anchor="middle">★${rating ? rating.toFixed(1) : '5.0'}</text>
          </g>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(44, 54),
      anchor: new window.google.maps.Point(22, 54),
    };
  };

  return (
    <div className={`relative w-full h-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* ── GOOGLE MAP CONTAINER ────────────────────────────────────────── */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: customerCoords.lat, lng: customerCoords.lng }}
        zoom={14}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {/* Customer Doorstep Marker */}
        <MarkerF
          position={{ lat: customerCoords.lat, lng: customerCoords.lng }}
          draggable={allowDragCustomerPin}
          icon={customerSvgIcon}
          title="Your Doorstep Location (Drag to adjust)"
          onDragEnd={async (e) => {
            if (e.latLng) {
              const newLat = Number(e.latLng.lat().toFixed(5));
              const newLng = Number(e.latLng.lng().toFixed(5));
              const newAddr = await reverseGeocode(newLat, newLng);
              onCustomerCoordsChange({
                lat: newLat,
                lng: newLng,
                label: newAddr.split(',')[0] || 'Pinned Doorstep',
                address: newAddr,
                accuracySource: 'search',
              });
              toast.success('Service doorstep updated!');
            }
          }}
        />

        {/* Dynamic Radius Circle */}
        {showRadiusCircle && (
          <CircleF
            center={{ lat: customerCoords.lat, lng: customerCoords.lng }}
            radius={radiusKm * 1000}
            options={{
              strokeColor: '#ea580c',
              strokeOpacity: 0.7,
              strokeWeight: 2,
              fillColor: '#ea580c',
              fillOpacity: 0.08,
            }}
          />
        )}

        {/* Provider Markers */}
        {visibleProviders.map((p) => {
          const isSelected = selectedProvider?.id === p.id;
          const pLat = p.latitude || customerCoords.lat;
          const pLng = p.longitude || customerCoords.lng;
          return (
            <MarkerF
              key={p.id}
              position={{ lat: pLat, lng: pLng }}
              icon={getProviderSvgIcon(p.rating, isSelected)}
              title={`${p.full_name} (${p.skills?.[0] || 'Partner'})`}
              onClick={() => onSelectProvider(isSelected ? null : p)}
            />
          );
        })}
      </GoogleMap>

      {/* ── TOP-LEFT SEARCH & STATUS OVERLAY ────────────────────────────── */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[85%] sm:max-w-md">
        {/* Autocomplete Search Bar */}
        <div ref={searchContainerRef} className="relative w-full">
          <div className="flex items-center bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-xl px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-primary transition-all">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search colony, society or landmark..."
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-background/98 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-30 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.lat}-${item.lng}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-muted/80 border-b border-border/50 last:border-b-0 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Status Pill & Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-background/95 backdrop-blur-md px-3 py-1 rounded-full border border-border shadow-md flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{visibleProviders.length} Pros nearby ({radiusKm} km)</span>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-md border border-primary/20">
              Google Maps
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFilterTopRatedOnly((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-md transition-all flex items-center gap-1 ${
              filterTopRatedOnly
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-background/95 backdrop-blur-md border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>4.8+ ★ Only</span>
          </button>
        </div>
      </div>

      {/* ── TOP-RIGHT CONTROLS: LAYER SWITCHER & TOOLBAR ────────────────── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        {/* Layer Switcher */}
        <div className="bg-background/95 backdrop-blur-md p-1 rounded-xl border border-border shadow-lg flex items-center gap-1">
          {(
            [
              { key: 'streets', label: 'Streets', icon: '🗺️' },
              { key: 'satellite', label: 'Satellite', icon: '🛰️' },
              { key: 'dark', label: 'Dark', icon: '🌙' },
              { key: 'terrain', label: 'Terrain', icon: '🏔️' },
            ] as const
          ).map((layer) => (
            <button
              key={layer.key}
              type="button"
              onClick={() => setActiveLayer(layer.key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                activeLayer === layer.key
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={`Switch to ${layer.label} view`}
            >
              <span>{layer.icon}</span>
              <span className="hidden sm:inline">{layer.label}</span>
            </button>
          ))}
        </div>

        {/* Floating Zoom & Location Panel */}
        <div className="bg-background/95 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-lg flex flex-col gap-1 items-center">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-border/60 my-0.5" />

          {/* Locate Device GPS */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocatingDevice}
            title="Locate My Device (High Accuracy GPS)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all active:scale-95"
          >
            {isLocatingDevice ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Navigation className="w-4 h-4 fill-primary/20" />
            )}
          </button>

          {/* Recenter Pin */}
          <button
            type="button"
            onClick={handleRecenter}
            title="Center on Pinned Doorstep"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Radius Circle Toggle */}
          <button
            type="button"
            onClick={() => setShowRadiusCircle((prev) => !prev)}
            title={showRadiusCircle ? 'Hide Radius Circle' : 'Show Radius Circle'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              showRadiusCircle ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {showRadiusCircle ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── BOTTOM RADIUS SELECTOR BAR ──────────────────────────────────── */}
      {onRadiusChange && !selectedProvider && (
        <div className="absolute bottom-3 left-3 z-20 bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border shadow-xl flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3 h-3 text-primary" />
            Radius:
          </span>
          {[3, 5, 10, 15, 25].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                radiusKm === km
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {km}km
            </button>
          ))}
        </div>
      )}

      {/* ── SELECTED PROVIDER BOTTOM OVERLAY CARD ───────────────────────── */}
      {selectedProvider && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-background/98 backdrop-blur-xl border-2 border-primary/40 rounded-2xl p-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => onSelectProvider(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={
                    selectedProvider.avatar_url ||
                    'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={selectedProvider.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-background ring-1 ring-emerald-400" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-foreground text-sm truncate">
                    {selectedProvider.full_name}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {selectedProvider.rating || 4.9}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {selectedProvider.completed_jobs || 120}+ jobs completed
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>
                    ETA ~{estimateArrivalTimeMins(selectedProvider.distance_km || 2)} mins (
                    {selectedProvider.distance_km?.toFixed(1) || '1.8'} km away)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Visiting Charge
                </span>
                <span className="text-sm font-extrabold text-primary">
                  ₹{selectedProvider.hourly_rate || 249}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectProvider(null)}
                  className="rounded-xl text-xs h-9 px-3"
                >
                  Dismiss
                </Button>
                {onBookProvider && (
                  <Button
                    size="sm"
                    onClick={() => onBookProvider(selectedProvider)}
                    className="rounded-xl text-xs h-9 px-4 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
                  >
                    Direct Book
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LEAFLET REAL STREET MAP VIEW (FALLBACK ENGINE) ───────────────────────────
interface LeafletRealStreetMapViewProps {
  customerCoords: GeoLocation;
  onCustomerCoordsChange: (newCoords: GeoLocation) => void;
  providers: (DbProviderProfile & { distance_km?: number })[];
  selectedProvider: (DbProviderProfile & { distance_km?: number }) | null;
  onSelectProvider: (provider: DbProviderProfile | null) => void;
  radiusKm: number;
  onRadiusChange?: (radiusKm: number) => void;
  onBookProvider?: (provider: DbProviderProfile) => void;
  allowDragCustomerPin?: boolean;
  isGoogleAvailable?: boolean;
  onToggleEngine?: () => void;
}

const LeafletRealStreetMapView: React.FC<LeafletRealStreetMapViewProps> = ({
  customerCoords,
  onCustomerCoordsChange,
  providers,
  selectedProvider,
  onSelectProvider,
  radiusKm,
  onRadiusChange,
  onBookProvider,
  allowDragCustomerPin,
  isGoogleAvailable,
  onToggleEngine,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const providerMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // Map Controls State
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  const [filterTopRatedOnly, setFilterTopRatedOnly] = useState(false);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced Location Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
      } catch (e) {
        console.warn('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (loc: GeoLocation) => {
    onCustomerCoordsChange(loc);
    setShowSearchDropdown(false);
    setSearchQuery(loc.label || loc.address || '');
    if (mapRef.current) {
      mapRef.current.flyTo([loc.lat, loc.lng], 15, { animate: true, duration: 1.2 });
    }
    toast.success(`Location set to: ${loc.label || 'Selected Location'}`);
  };

  const handleDetectGPS = async () => {
    setIsLocatingDevice(true);
    toast.info('Detecting device location via GPS & Network...');
    try {
      const loc = await getUserDeviceLocation();
      onCustomerCoordsChange(loc);
      if (mapRef.current) {
        mapRef.current.flyTo([loc.lat, loc.lng], 15, { animate: true, duration: 1.2 });
      }
      toast.success(`Found location: ${loc.label || 'Your Current Area'}`);
    } catch (err) {
      console.warn('GPS detection failed:', err);
      toast.error('Unable to retrieve GPS fix. You can drag the blue pin or search your colony.');
    } finally {
      setIsLocatingDevice(false);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([customerCoords.lat, customerCoords.lng], 14, { animate: true });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [customerCoords.lat, customerCoords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const tileConfig = LEAFLET_TILE_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: 'abcd',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Customer Doorstep Marker
    const customerIcon = L.divIcon({
      className: 'nearmitra-customer-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${allowDragCustomerPin ? 'grab' : 'default'};">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 16px rgba(37,99,235,0.6); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style="margin-top: 4px; background: rgba(15,23,42,0.95); color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);">
            🏠 Your Doorstep
          </div>
        </div>
      `,
      iconSize: [44, 64],
      iconAnchor: [22, 44],
    });

    const customerMarker = L.marker([customerCoords.lat, customerCoords.lng], {
      icon: customerIcon,
      draggable: Boolean(allowDragCustomerPin),
    }).addTo(map);

    if (allowDragCustomerPin) {
      customerMarker.on('dragend', async (e) => {
        const marker = e.target as L.Marker;
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(5));
        const newLng = Number(position.lng.toFixed(5));
        const newAddr = await reverseGeocode(newLat, newLng);

        onCustomerCoordsChange({
          lat: newLat,
          lng: newLng,
          label: newAddr.split(',')[0] || 'Pinned Doorstep',
          address: newAddr,
          accuracySource: 'search',
        });
        toast.success('Service doorstep updated!');
      });
    }

    customerMarkerRef.current = customerMarker;

    // Radius Circle
    const circle = L.circle([customerCoords.lat, customerCoords.lng], {
      radius: radiusKm * 1000,
      color: '#ea580c',
      weight: 2,
      opacity: 0.7,
      fillColor: '#ea580c',
      fillOpacity: 0.08,
      dashArray: '4, 6',
    }).addTo(map);
    radiusCircleRef.current = circle;

    // Provider Markers Group
    const providerMarkersGroup = L.layerGroup().addTo(map);
    providerMarkersGroupRef.current = providerMarkersGroup;

    mapRef.current = map;

    // Invalidate size after layout transition
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(containerRef.current);
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      ro.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [allowDragCustomerPin]);

  // Update Tile Layer on Active Layer Change
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const tileConfig = LEAFLET_TILE_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      subdomains: 'abcd',
    }).addTo(mapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Update Customer Marker & Circle on coords or radius change
  useEffect(() => {
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([customerCoords.lat, customerCoords.lng]);
      radiusCircleRef.current.setRadius(radiusKm * 1000);
      radiusCircleRef.current.setStyle({
        opacity: showRadiusCircle ? 0.7 : 0,
        fillOpacity: showRadiusCircle ? 0.08 : 0,
      });
    }
  }, [customerCoords, radiusKm, showRadiusCircle]);

  // Render Provider Markers
  useEffect(() => {
    if (!providerMarkersGroupRef.current || !mapRef.current) return;
    providerMarkersGroupRef.current.clearLayers();

    const filtered = providers.filter((p) => {
      if (filterTopRatedOnly && (p.rating || 0) < 4.8) return false;
      const pLat = p.latitude || customerCoords.lat;
      const pLng = p.longitude || customerCoords.lng;
      const dist = calculateHaversineDistanceKm(customerCoords.lat, customerCoords.lng, pLat, pLng);
      return dist <= radiusKm * 1.35;
    });

    filtered.forEach((p) => {
      const isSelected = selectedProvider?.id === p.id;
      const pLat = p.latitude || customerCoords.lat;
      const pLng = p.longitude || customerCoords.lng;
      const dist = calculateHaversineDistanceKm(customerCoords.lat, customerCoords.lng, pLat, pLng);

      const markerHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;" class="hover:scale-110">
          <div style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 3px solid ${isSelected ? '#ea580c' : '#ffffff'}; box-shadow: 0 4px 16px rgba(0,0,0,0.3); background: #0f172a; position: relative;">
            <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${p.full_name}" />
            <div style="position: absolute; bottom: 0; right: 0; background: #ea580c; color: #ffffff; font-size: 8px; font-weight: 900; padding: 1px 3px; border-radius: 4px;">
              ★${p.rating || 4.9}
            </div>
          </div>
          <div style="margin-top: 3px; background: ${isSelected ? '#ea580c' : '#1e293b'}; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);">
            ${p.full_name.split(' ')[0]} • ${dist.toFixed(1)}km
          </div>
        </div>
      `;

      const providerIcon = L.divIcon({
        className: 'nearmitra-provider-pin',
        html: markerHtml,
        iconSize: [44, 60],
        iconAnchor: [22, 44],
      });

      const marker = L.marker([pLat, pLng], { icon: providerIcon });
      marker.on('click', () => {
        onSelectProvider(isSelected ? null : p);
      });

      providerMarkersGroupRef.current?.addLayer(marker);
    });
  }, [providers, selectedProvider, customerCoords, radiusKm, filterTopRatedOnly, onSelectProvider]);

  return (
    <div className={`relative w-full h-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* ── TOP-LEFT SEARCH & STATUS ──────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[85%] sm:max-w-md">
        <div ref={searchContainerRef} className="relative w-full">
          <div className="flex items-center bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-xl px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-primary transition-all">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search area, landmark or colony..."
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-background/98 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-30 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.lat}-${item.lng}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-muted/80 border-b border-border/50 last:border-b-0 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-background/95 backdrop-blur-md px-3 py-1 rounded-full border border-border shadow-md flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{providers.length} Pros nearby ({radiusKm} km)</span>
          </div>

          <button
            type="button"
            onClick={() => setFilterTopRatedOnly((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-md transition-all flex items-center gap-1 ${
              filterTopRatedOnly
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-background/95 backdrop-blur-md border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span>4.8+ ★ Only</span>
          </button>
        </div>
      </div>

      {/* ── TOP-RIGHT CONTROLS ────────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
        <div className="bg-background/95 backdrop-blur-md p-1 rounded-xl border border-border shadow-lg flex items-center gap-1">
          {(Object.keys(LEAFLET_TILE_LAYERS) as MapLayerType[]).map((layerKey) => {
            const config = LEAFLET_TILE_LAYERS[layerKey];
            const isActive = activeLayer === layerKey;
            return (
              <button
                key={layerKey}
                type="button"
                onClick={() => setActiveLayer(layerKey)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={`Switch to ${config.name} view`}
              >
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{config.name}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-background/95 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-lg flex flex-col gap-1 items-center">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-border/60 my-0.5" />

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocatingDevice}
            title="Locate My Device (High Accuracy GPS)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all active:scale-95"
          >
            {isLocatingDevice ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Navigation className="w-4 h-4 fill-primary/20" />
            )}
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            title="Center on Pinned Doorstep"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowRadiusCircle((prev) => !prev)}
            title={showRadiusCircle ? 'Hide Radius Circle' : 'Show Radius Circle'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              showRadiusCircle ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {showRadiusCircle ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── BOTTOM RADIUS SELECTOR BAR ──────────────────────────────────── */}
      {onRadiusChange && !selectedProvider && (
        <div className="absolute bottom-3 left-3 z-20 bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border shadow-xl flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3 h-3 text-primary" />
            Radius:
          </span>
          {[3, 5, 10, 15, 25].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onRadiusChange(km)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                radiusKm === km
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {km}km
            </button>
          ))}
        </div>
      )}

      {/* ── SELECTED PROVIDER BOTTOM OVERLAY CARD ───────────────────────── */}
      {selectedProvider && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-background/98 backdrop-blur-xl border-2 border-primary/40 rounded-2xl p-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => onSelectProvider(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={
                    selectedProvider.avatar_url ||
                    'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={selectedProvider.full_name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-background ring-1 ring-emerald-400" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-foreground text-sm truncate">
                    {selectedProvider.full_name}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {selectedProvider.rating || 4.9}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {selectedProvider.completed_jobs || 120}+ jobs completed
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>
                    ETA ~{estimateArrivalTimeMins(selectedProvider.distance_km || 2)} mins (
                    {selectedProvider.distance_km?.toFixed(1) || '1.8'} km away)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Visiting Charge
                </span>
                <span className="text-sm font-extrabold text-primary">
                  ₹{selectedProvider.hourly_rate || 249}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectProvider(null)}
                  className="rounded-xl text-xs h-9 px-3"
                >
                  Dismiss
                </Button>
                {onBookProvider && (
                  <Button
                    size="sm"
                    onClick={() => onBookProvider(selectedProvider)}
                    className="rounded-xl text-xs h-9 px-4 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
                  >
                    Direct Book
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
