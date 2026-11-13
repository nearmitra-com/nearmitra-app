import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  PolylineF,
  CircleF,
} from '@react-google-maps/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Phone,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Clock,
  MapPin,
  Layers,
  Crosshair,
  KeyRound,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Compass,
  Home,
  Check,
  Zap,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  GeoLocation,
  calculateHaversineDistanceKm,
  estimateArrivalTimeMins,
  generateCurvedRoutePoints,
  getSavedCustomerLocation,
} from '@/lib/geoUtils';
import {
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_SCRIPT_ID,
  getGoogleMapsApiKey,
  hasValidGoogleMapsApiKey,
  GOOGLE_MAPS_DARK_STYLES,
} from '@/lib/googleMapsConfig';

export interface LiveProviderTrackingMapProps {
  bookingId: string;
  customerLocation?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  provider?: {
    id?: string;
    full_name?: string;
    phone?: string;
    skills?: string[];
    avatar_url?: string;
    rating?: number;
    latitude?: number;
    longitude?: number;
  } | null;
  status: string; // 'pending' | 'pending_provider' | 'accepted' | 'in_progress' | 'reached_site' | 'completed' | 'cancelled'
  height?: string;
  onSimulateStatusChange?: (nextStatus: string) => void;
}

type MapLayerType = 'streets' | 'satellite' | 'dark' | 'terrain';

const LEAFLET_TILE_LAYERS: Record<MapLayerType, { url: string; attribution: string; maxZoom: number }> = {
  streets: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: 'CartoDB Voyager',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri Satellite',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: 'CartoDB Dark Matter',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri Topo',
    maxZoom: 19,
  },
};

const mapWrapperStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
};

export const LiveProviderTrackingMap: React.FC<LiveProviderTrackingMapProps> = ({
  bookingId,
  customerLocation,
  provider,
  status,
  height = '420px',
  onSimulateStatusChange,
}) => {
  const apiKey = getGoogleMapsApiKey();
  const hasKey = hasValidGoogleMapsApiKey();

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: hasKey ? apiKey : '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // State
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('streets');
  const [showTraffic, setShowTraffic] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0.28); // 0 to 1 progress along route
  const [copiedPin, setCopiedPin] = useState(false);

  // Directions data from Google Maps API
  const [directionsPath, setDirectionsPath] = useState<{ lat: number; lng: number }[]>([]);
  const [googleDistanceText, setGoogleDistanceText] = useState<string>('');
  const [googleDurationText, setGoogleDurationText] = useState<string>('');

  // Google Map instance ref
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  // Generate 4-digit security start PIN based on bookingId
  const securityPin = useMemo(() => {
    let hash = 0;
    const str = bookingId || 'BK-1000';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const pin = Math.abs(hash % 9000) + 1000;
    return String(pin);
  }, [bookingId]);

  // Customer Coordinates (fallback to saved location)
  const defaultSaved = useMemo(() => getSavedCustomerLocation(), []);
  const custLat = customerLocation?.lat ?? defaultSaved.lat;
  const custLng = customerLocation?.lng ?? defaultSaved.lng;

  // Is booking currently in pending/finding provider state
  const isMatchingPartner = (status === 'pending' || status === 'pending_provider') && !provider;

  // Provider Coordinates (fallback to ~1.6 km away for realism)
  const provLat = provider?.latitude ?? custLat + 0.012;
  const provLng = provider?.longitude ?? custLng - 0.015;

  // Straight line fallback distance
  const baseDistanceKm = useMemo(() => {
    return calculateHaversineDistanceKm(provLat, provLng, custLat, custLng);
  }, [provLat, provLng, custLat, custLng]);

  // Fallback Curved Route Points (for Leaflet or when directions pending)
  const fallbackRoutePoints = useMemo(() => {
    return generateCurvedRoutePoints(
      { lat: provLat, lng: provLng },
      { lat: custLat, lng: custLng },
      32
    );
  }, [provLat, provLng, custLat, custLng]);

  // Active path to follow (Google directions road polyline if ready, else fallback)
  const activeRoutePoints = useMemo(() => {
    if (directionsPath.length > 0) {
      return directionsPath;
    }
    return fallbackRoutePoints.map(([lat, lng]) => ({ lat, lng }));
  }, [directionsPath, fallbackRoutePoints]);

  // Automated Google Directions Calculation
  useEffect(() => {
    if (!isLoaded || loadError || isMatchingPartner || typeof window === 'undefined' || !window.google?.maps) {
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: provLat, lng: provLng },
          destination: { lat: custLat, lng: custLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, statusResult) => {
          if (statusResult === window.google.maps.DirectionsStatus.OK && result && result.routes[0]) {
            const overview = result.routes[0].overview_path;
            if (overview && overview.length > 0) {
              const points = overview.map((pt) => ({
                lat: pt.lat(),
                lng: pt.lng(),
              }));
              setDirectionsPath(points);
            }

            const leg = result.routes[0].legs[0];
            if (leg) {
              if (leg.distance?.text) setGoogleDistanceText(leg.distance.text);
              if (leg.duration?.text) setGoogleDurationText(leg.duration.text);
            }
          } else {
            console.warn('Google DirectionsService failed, using smooth geometric fallback route:', statusResult);
          }
        }
      );
    } catch (e) {
      console.warn('Google Directions error:', e);
    }
  }, [isLoaded, loadError, isMatchingPartner, provLat, provLng, custLat, custLng]);

  // Live progressive animation along the route
  useEffect(() => {
    if (!['pending_provider', 'accepted', 'in_progress'].includes(status)) return;

    const interval = setInterval(() => {
      setLiveProgress((prev) => {
        if (prev >= 0.94) {
          // If technician gets close, notify or hold
          return 0.95;
        }
        return prev + 0.015;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  // Current animated technician position along active route
  const currentProviderPos = useMemo(() => {
    if (status === 'reached_site' || status === 'completed') {
      return { lat: custLat, lng: custLng };
    }
    if (activeRoutePoints.length === 0) {
      return { lat: provLat, lng: provLng };
    }
    const idx = Math.min(
      Math.floor(liveProgress * (activeRoutePoints.length - 1)),
      activeRoutePoints.length - 1
    );
    return activeRoutePoints[idx] || { lat: provLat, lng: provLng };
  }, [liveProgress, activeRoutePoints, custLat, custLng, provLat, provLng, status]);

  // Dynamic remaining distance and ETA
  const displayDistance = useMemo(() => {
    if (status === 'reached_site' || status === 'completed') return '0 km';
    if (googleDistanceText) {
      const remainingRatio = 1 - liveProgress;
      const parsedNum = parseFloat(googleDistanceText);
      if (!isNaN(parsedNum)) {
        return `${(parsedNum * remainingRatio).toFixed(1)} km`;
      }
      return googleDistanceText;
    }
    const remainingRatio = 1 - liveProgress;
    return `${(baseDistanceKm * remainingRatio).toFixed(1)} km`;
  }, [status, googleDistanceText, liveProgress, baseDistanceKm]);

  const displayEta = useMemo(() => {
    if (status === 'reached_site') return 'Arrived on Site';
    if (status === 'completed') return 'Service Completed';
    if (googleDurationText) {
      const remainingRatio = 1 - liveProgress;
      const parsedNum = parseInt(googleDurationText, 10);
      if (!isNaN(parsedNum)) {
        const adjusted = Math.max(2, Math.round(parsedNum * remainingRatio));
        return `${adjusted} mins`;
      }
      return googleDurationText;
    }
    const distNum = parseFloat(displayDistance);
    return `${estimateArrivalTimeMins(isNaN(distNum) ? 3 : distNum)} mins`;
  }, [status, googleDurationText, liveProgress, displayDistance]);

  // Handle Google Maps Traffic Layer
  const onGoogleMapLoad = useCallback((map: google.maps.Map) => {
    googleMapRef.current = map;

    // Trigger resize event after short delay to fix any container accordion animation
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.google?.maps) {
        window.google.maps.event.trigger(map, 'resize');
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (!googleMapRef.current || typeof window === 'undefined' || !window.google?.maps) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new window.google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(googleMapRef.current);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  }, [showTraffic]);

  // Map Controls Helpers
  const handleZoomIn = () => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom((googleMapRef.current.getZoom() || 14) + 1);
    }
  };

  const handleZoomOut = () => {
    if (googleMapRef.current) {
      googleMapRef.current.setZoom((googleMapRef.current.getZoom() || 14) - 1);
    }
  };

  const handleRecenterRoute = () => {
    if (!googleMapRef.current) return;
    if (isMatchingPartner) {
      googleMapRef.current.panTo({ lat: custLat, lng: custLng });
      googleMapRef.current.setZoom(14);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: custLat, lng: custLng });
      bounds.extend({ lat: currentProviderPos.lat, lng: currentProviderPos.lng });
      googleMapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  };

  const handleFocusProvider = () => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: currentProviderPos.lat, lng: currentProviderPos.lng });
      googleMapRef.current.setZoom(16);
    }
  };

  const handleFocusDoorstep = () => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat: custLat, lng: custLng });
      googleMapRef.current.setZoom(16);
    }
  };

  const handleCopySecurityPin = () => {
    navigator.clipboard.writeText(securityPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Google Map options based on layer
  const googleMapOptions: google.maps.MapOptions = useMemo(() => {
    let mapTypeId: google.maps.MapTypeId | string = 'roadmap';
    let styles: google.maps.MapTypeStyle[] = [];

    if (activeLayer === 'satellite') {
      mapTypeId = 'hybrid'; // Satellite with street names & labels
    } else if (activeLayer === 'dark') {
      mapTypeId = 'roadmap';
      styles = GOOGLE_MAPS_DARK_STYLES;
    } else if (activeLayer === 'terrain') {
      mapTypeId = 'terrain';
    } else {
      mapTypeId = 'roadmap';
      styles = [];
    }

    return {
      mapTypeId,
      styles,
      disableDefaultUI: true, // We render our own premium glassmorphic controls
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
    };
  }, [activeLayer]);

  // Clean phone number for WhatsApp
  const cleanPhone = (provider?.phone || '').replace(/[^0-9]/g, '').slice(-10);

  // SVG Marker Icons for Google Maps
  const doorstepSvgIcon = useMemo(() => {
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

  const technicianSvgIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.google?.maps) return undefined;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#ea580c" flood-opacity="0.5"/>
          </filter>
          <g filter="url(#glow)">
            <path d="M25 0C11.193 0 0 11.193 0 25c0 18 25 35 25 35s25-17 25-35C50 11.193 38.807 0 25 0z" fill="#ea580c"/>
            <circle cx="25" cy="24" r="19" fill="#ffffff"/>
            <!-- Scooter / Service Partner Icon -->
            <path d="M17 30a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm16 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#ea580c"/>
            <path d="M19 27h6l4-8h-5l-2 4h-4z" fill="#ea580c"/>
            <circle cx="32" cy="16" r="2.5" fill="#ea580c"/>
          </g>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(50, 60),
      anchor: new window.google.maps.Point(25, 60),
    };
  }, []);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* ── GOOGLE MAPS API ENGINE (When Key is Loaded) ── */}
      {isLoaded && !loadError ? (
        <GoogleMap
          mapContainerStyle={mapWrapperStyle}
          center={{
            lat: isMatchingPartner ? custLat : (custLat + provLat) / 2,
            lng: isMatchingPartner ? custLng : (custLng + provLng) / 2,
          }}
          zoom={isMatchingPartner ? 14 : 13}
          options={googleMapOptions}
          onLoad={onGoogleMapLoad}
        >
          {/* Customer Doorstep Marker */}
          <MarkerF
            position={{ lat: custLat, lng: custLng }}
            icon={doorstepSvgIcon}
            title="Your Doorstep Service Destination"
          />

          {/* Pending Radar Mode Circle */}
          {isMatchingPartner && (
            <CircleF
              center={{ lat: custLat, lng: custLng }}
              radius={2200}
              options={{
                strokeColor: '#ea580c',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#ea580c',
                fillOpacity: 0.12,
              }}
            />
          )}

          {/* Active Navigation Route Polyline */}
          {!isMatchingPartner && activeRoutePoints.length > 0 && (
            <>
              {/* Outer Glow Line */}
              <PolylineF
                path={activeRoutePoints}
                options={{
                  strokeColor: activeLayer === 'satellite' ? '#38bdf8' : '#2563eb',
                  strokeOpacity: 0.4,
                  strokeWeight: 10,
                }}
              />
              {/* Inner High-Contrast Road Path */}
              <PolylineF
                path={activeRoutePoints}
                options={{
                  strokeColor: activeLayer === 'satellite' ? '#0284c7' : '#1d4ed8',
                  strokeOpacity: 0.95,
                  strokeWeight: 5,
                }}
              />
            </>
          )}

          {/* Moving Technician Marker */}
          {!isMatchingPartner && (
            <MarkerF
              position={{ lat: currentProviderPos.lat, lng: currentProviderPos.lng }}
              icon={technicianSvgIcon}
              title={`${provider?.full_name || 'Service Partner'} (Live On Job)`}
            />
          )}
        </GoogleMap>
      ) : (
        /* ── SEAMLESS LEAFLET FALLBACK ENGINE (If Google Maps is offline/loading) ── */
        <LeafletTrackingFallback
          activeLayer={activeLayer}
          custLat={custLat}
          custLng={custLng}
          provLat={provLat}
          provLng={provLng}
          currentProviderPos={currentProviderPos}
          activeRoutePoints={fallbackRoutePoints}
          isMatchingPartner={isMatchingPartner}
          provider={provider}
          customerLocation={customerLocation}
        />
      )}

      {/* ── TOP FLOATING CONTROL BAR ────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 gap-2">
        {/* Status Chip */}
        <div className="pointer-events-auto flex items-center gap-2 bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-border/80">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-foreground">
            {isMatchingPartner
              ? '📡 Dispatch Radar Scanning'
              : status === 'reached_site'
              ? '🏁 Partner Reached Site'
              : 'Live Partner Navigation'}
          </span>
          {isLoaded && (
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-md border border-primary/20">
              Google Maps
            </span>
          )}
        </div>

        {/* Layer Switcher & Traffic Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-background/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-border/80">
          {(
            [
              { key: 'streets', label: 'Street', icon: '🗺️' },
              { key: 'satellite', label: 'Satellite', icon: '🛰️' },
              { key: 'dark', label: 'Dark', icon: '🌙' },
              { key: 'terrain', label: 'Terrain', icon: '🏔️' },
            ] as const
          ).map((layer) => (
            <button
              key={layer.key}
              onClick={() => setActiveLayer(layer.key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeLayer === layer.key
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
              title={`${layer.label} View`}
            >
              <span>{layer.icon}</span>
              <span className="hidden sm:inline">{layer.label}</span>
            </button>
          ))}

          {/* Traffic Layer Toggle (Google Maps exclusive) */}
          {isLoaded && (
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold transition-all border ${
                showTraffic
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted/60'
              }`}
              title="Toggle Live Road Traffic"
            >
              <span>🚦</span>
              <span className="hidden md:inline">Traffic</span>
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT FLOATING MAP TOOLBAR ──────────────────────────────────── */}
      <div className="absolute right-3 top-16 flex flex-col gap-1.5 z-10">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-9 h-px bg-border/60 my-0.5" />

        <button
          onClick={handleRecenterRoute}
          className="w-9 h-9 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
          title="Recenter Full Route"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {!isMatchingPartner && (
          <button
            onClick={handleFocusProvider}
            className="w-9 h-9 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:bg-accent hover:text-white transition-colors"
            title="Focus On Partner"
          >
            <Compass className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleFocusDoorstep}
          className="w-9 h-9 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-colors"
          title="Focus On Doorstep"
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-9 h-9 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── RADAR PULSE OVERLAY (When searching for provider) ───────────── */}
      {isMatchingPartner && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-5">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full border-2 border-primary/30 animate-ping opacity-60" />
            <div className="absolute w-44 h-44 rounded-full border-2 border-accent/40 animate-pulse" />
            <div className="bg-background/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-primary/30 flex items-center gap-3 text-xs pointer-events-auto">
              <Activity className="w-4 h-4 text-primary animate-spin" />
              <div>
                <p className="font-bold text-foreground">Matching Certified Specialist...</p>
                <p className="text-[11px] text-muted-foreground">Alerting technicians within 5 km of your doorstep</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM INTERACTIVE PARTNER & SECURITY BAR ───────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-auto z-10 space-y-2">
        <div className="bg-background/95 backdrop-blur-md p-3.5 rounded-2xl border border-border/80 shadow-2xl space-y-3">
          {/* Row 1: ETA + Distance + Security PIN */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                  Live Traffic ETA
                </span>
                <span className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
                  {displayEta}
                  <span className="text-xs font-semibold text-muted-foreground">({displayDistance})</span>
                </span>
              </div>
            </div>

            {/* 4-Digit Security Start PIN */}
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-xl">
              <div>
                <span className="text-[9px] uppercase font-bold text-primary block leading-none">
                  Service Start PIN
                </span>
                <span className="text-sm font-mono font-black text-primary tracking-widest">
                  {securityPin}
                </span>
              </div>
              <button
                onClick={handleCopySecurityPin}
                className="text-xs text-primary hover:text-primary/80 font-bold p-1 rounded-md"
                title="Copy Start PIN"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : 'Copy'}
              </button>
            </div>
          </div>

          {/* Row 2: Provider Details & Contact CTA */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/40 flex-shrink-0 bg-muted">
                <img
                  src={
                    provider?.avatar_url ||
                    'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={provider?.full_name || 'Specialist'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                  {provider?.full_name || 'Verified Technician'}
                  <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {provider?.skills && provider.skills.length > 0
                    ? provider.skills[0]
                    : 'Home Service Specialist'}
                </p>
              </div>
            </div>

            {/* Direct Call & WhatsApp Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {provider?.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Call Partner</span>
                </a>
              )}
              {cleanPhone && (
                <a
                  href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${provider?.full_name || 'Partner'}, I am tracking my NearMitra service booking (#${bookingId}). What is your current location?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── LEAFLET FALLBACK ENGINE ──────────────────────────────────────────────────
interface LeafletTrackingFallbackProps {
  activeLayer: MapLayerType;
  custLat: number;
  custLng: number;
  provLat: number;
  provLng: number;
  currentProviderPos: { lat: number; lng: number };
  activeRoutePoints: [number, number][];
  isMatchingPartner: boolean;
  provider?: LiveProviderTrackingMapProps['provider'];
  customerLocation?: LiveProviderTrackingMapProps['customerLocation'];
}

const LeafletTrackingFallback: React.FC<LeafletTrackingFallbackProps> = ({
  activeLayer,
  custLat,
  custLng,
  provLat,
  provLng,
  currentProviderPos,
  activeRoutePoints,
  isMatchingPartner,
  provider,
  customerLocation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const centerLat = isMatchingPartner ? custLat : (provLat + custLat) / 2;
    const centerLng = isMatchingPartner ? custLng : (provLng + custLng) / 2;

    const map = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: isMatchingPartner ? 14 : 13,
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
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 16px rgba(37,99,235,0.6); display: flex; align-items: center; justify-content: center; color: white;">
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
      iconAnchor: [22, 42],
    });

    L.marker([custLat, custLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>Your Service Location</b><br/>${customerLocation?.address || 'Doorstep destination'}`);

    if (isMatchingPartner) {
      L.circle([custLat, custLng], {
        radius: 2000,
        color: '#ea580c',
        weight: 2,
        opacity: 0.7,
        fillColor: '#ea580c',
        fillOpacity: 0.08,
        dashArray: '6, 6',
      }).addTo(map);
    } else {
      // Draw Polyline
      L.polyline(activeRoutePoints, {
        color: activeLayer === 'satellite' ? '#38bdf8' : '#2563eb',
        weight: 6,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      // Technician Marker
      const provName = provider?.full_name ? provider.full_name.split(' ')[0] : 'Partner';
      const providerIcon = L.divIcon({
        className: 'nearmitra-provider-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #ea580c; border: 3px solid #ffffff; box-shadow: 0 4px 16px rgba(234,88,12,0.6); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            </div>
            <div style="margin-top: 4px; background: #ea580c; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              🛵 ${provName} (En Route)
            </div>
          </div>
        `,
        iconSize: [44, 64],
        iconAnchor: [22, 44],
      });

      const pMarker = L.marker([currentProviderPos.lat, currentProviderPos.lng], { icon: providerIcon }).addTo(map);
      providerMarkerRef.current = pMarker;
    }

    mapInstanceRef.current = map;

    // Resize observer to eliminate grey tiles inside accordion containers
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(containerRef.current);

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [custLat, custLng, provLat, provLng, isMatchingPartner, activeLayer, activeRoutePoints]);

  return <div ref={containerRef} className="w-full h-full" />;
};
