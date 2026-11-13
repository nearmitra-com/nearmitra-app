// Geo and Distance Utilities for NearMitra Hyperlocal Matching

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
  address?: string;
  accuracySource?: 'gps' | 'ip' | 'search' | 'preset';
}

export const CITY_PRESETS: { name: string; state: string; lat: number; lng: number }[] = [
  { name: 'Mumbai (BKC)', state: 'Maharashtra', lat: 19.0657, lng: 72.8687 },
  { name: 'Andheri West', state: 'Mumbai', lat: 19.1363, lng: 72.8277 },
  { name: 'Bandra West', state: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  { name: 'Powai', state: 'Mumbai', lat: 19.1176, lng: 72.9060 },
  { name: 'Thane West', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  { name: 'Navi Mumbai (Vashi)', state: 'Maharashtra', lat: 19.0748, lng: 72.9978 },
  { name: 'Delhi (Connaught Place)', state: 'Delhi NCR', lat: 28.6315, lng: 77.2167 },
  { name: 'Noida (Sector 62)', state: 'Delhi NCR', lat: 28.6276, lng: 77.3653 },
  { name: 'Gurugram (Cyber City)', state: 'Delhi NCR', lat: 28.4907, lng: 77.0886 },
  { name: 'Bengaluru (Koramangala)', state: 'Karnataka', lat: 12.9352, lng: 77.6245 },
  { name: 'Bengaluru (Indiranagar)', state: 'Karnataka', lat: 12.9784, lng: 77.6408 },
  { name: 'Pune (Shivajinagar)', state: 'Maharashtra', lat: 18.5314, lng: 73.8446 },
  { name: 'Pune (Hinjewadi)', state: 'Maharashtra', lat: 18.5913, lng: 73.7389 },
  { name: 'Hyderabad (Hitec City)', state: 'Telangana', lat: 17.4435, lng: 78.3772 },
  { name: 'Chennai (T. Nagar)', state: 'Tamil Nadu', lat: 13.0418, lng: 80.2341 },
  { name: 'Kolkata (Park Street)', state: 'West Bengal', lat: 22.5516, lng: 88.3524 },
  { name: 'Ahmedabad (SG Highway)', state: 'Gujarat', lat: 23.0338, lng: 72.5085 },
  { name: 'Jaipur (Malviya Nagar)', state: 'Rajasthan', lat: 26.8532, lng: 75.8055 },
  { name: 'Lucknow (Gomti Nagar)', state: 'Uttar Pradesh', lat: 26.8507, lng: 80.9995 },
  { name: 'Indore (Vijay Nagar)', state: 'Madhya Pradesh', lat: 22.7533, lng: 75.8937 },
  { name: 'Chandigarh (Sector 17)', state: 'Punjab/Haryana', lat: 30.7398, lng: 76.7827 },
];

export const DEFAULT_COORDS: GeoLocation = {
  lat: 19.0760,
  lng: 72.8777,
  label: 'Mumbai, Maharashtra',
  address: 'Mumbai, Maharashtra, India',
  accuracySource: 'preset',
};

/**
 * Calculates straight-line distance in kilometers between two geo coordinates using Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estimates realistic technician arrival time in minutes based on distance
 */
export function estimateArrivalTimeMins(distanceKm: number): number {
  if (distanceKm <= 1) return 15;
  if (distanceKm <= 3) return 25;
  if (distanceKm <= 7) return 35;
  if (distanceKm <= 15) return 50;
  return Math.round(distanceKm * 4 + 10);
}

/**
 * Reverse geocode latitude and longitude to human-readable address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // If Google Maps API is loaded on window, try using Google Geocoder first
  if (typeof window !== 'undefined' && typeof google !== 'undefined' && google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch (e) {
      console.warn('Google reverse geocode error, falling back to OSM:', e);
    }
  }

  // Fallback to OpenStreetMap Nominatim reverse geocode (free, public)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'NearMitra-App/1.0',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const parts = [
          addr.road || addr.suburb || addr.neighbourhood,
          addr.city_district || addr.city || addr.town || addr.village,
          addr.state,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
    }
  } catch (err) {
    console.warn('Reverse geocode failed:', err);
  }

  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

/**
 * Instant address & locality search using OpenStreetMap Nominatim / Photon
 */
export async function searchLocations(query: string): Promise<GeoLocation[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&countrycodes=in&limit=6&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'NearMitra-App/1.0',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item) => ({
          lat: Number(Number(item.lat).toFixed(5)),
          lng: Number(Number(item.lon).toFixed(5)),
          label: item.name || item.display_name.split(',')[0],
          address: item.display_name,
          accuracySource: 'search' as const,
        }));
      }
    }
  } catch (err) {
    console.warn('Search locations failed:', err);
  }
  return [];
}

/**
 * Accurately detects customer device location using high-accuracy HTML5 GPS (maximumAge: 0),
 * with fast multi-service IP fallback if browser permission is blocked or desktop lacks GPS hardware.
 */
export async function getUserDeviceLocation(): Promise<GeoLocation> {
  // 1. Try High-Accuracy Hardware / Browser GPS first (satellite / wifi triangulation)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0, // Force fresh real-time satellite/wifi fix (no stale cached location)
        });
      });

      const lat = Number(position.coords.latitude.toFixed(5));
      const lng = Number(position.coords.longitude.toFixed(5));
      const address = await reverseGeocode(lat, lng);

      const loc: GeoLocation = {
        lat,
        lng,
        label: address.split(',')[0] || 'Current Location',
        address,
        accuracySource: 'gps',
      };
      saveCustomerLocation(loc);
      return loc;
    } catch (gpsError) {
      console.warn('Browser GPS unavailable or timed out, trying IP fallback:', gpsError);
    }
  }

  // 2. Fallback 1: ipapi.co (Fast IP Geolocation)
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const lat = Number(Number(data.latitude).toFixed(5));
        const lng = Number(Number(data.longitude).toFixed(5));
        const city = data.city || '';
        const region = data.region || '';
        const label = [city, region].filter(Boolean).join(', ') || 'Your City';
        const address = `${city}${city && region ? ', ' : ''}${region}, India`;

        const loc: GeoLocation = {
          lat,
          lng,
          label,
          address,
          accuracySource: 'ip',
        };
        saveCustomerLocation(loc);
        return loc;
      }
    }
  } catch (ipErr) {
    console.warn('ipapi.co fallback failed, trying ipwho.is:', ipErr);
  }

  // 3. Fallback 2: ipwho.is (Secondary IP Geolocation Service)
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const lat = Number(Number(data.latitude).toFixed(5));
        const lng = Number(Number(data.longitude).toFixed(5));
        const city = data.city || '';
        const region = data.region || '';
        const label = [city, region].filter(Boolean).join(', ') || 'Your City';
        const address = `${city}${city && region ? ', ' : ''}${region}, India`;

        const loc: GeoLocation = {
          lat,
          lng,
          label,
          address,
          accuracySource: 'ip',
        };
        saveCustomerLocation(loc);
        return loc;
      }
    }
  } catch (err) {
    console.warn('Secondary IP fallback failed:', err);
  }

  // 4. Fallback to saved or default
  return getSavedCustomerLocation();
}

/**
 * Persist & restore user coordinates in local storage
 */
export function getSavedCustomerLocation(): GeoLocation {
  try {
    const saved = localStorage.getItem('nearmitra_customer_coords');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch { /* ignore */ }
  return DEFAULT_COORDS;
}

export function saveCustomerLocation(coords: GeoLocation) {
  try {
    localStorage.setItem('nearmitra_customer_coords', JSON.stringify(coords));
  } catch { /* ignore */ }
}

/**
 * Generates natural curved road-like points between provider and customer for map route polyline
 */
export function generateCurvedRoutePoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints = 24
): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const offsetLat = (end.lng - start.lng) * 0.15;
  const offsetLng = -(end.lat - start.lat) * 0.15;
  const controlLat = midLat + offsetLat;
  const controlLng = midLng + offsetLng;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlLng + t * t * end.lng;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return points;
}

