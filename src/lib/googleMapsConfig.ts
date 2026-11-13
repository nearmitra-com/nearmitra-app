// NearMitra Google Maps API Configuration & Loader Utilities

export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry' | 'drawing')[] = ['places', 'geometry'];
export const GOOGLE_MAPS_SCRIPT_ID = 'nearmitra-google-maps-js-sdk';

/**
 * Retrieves the Google Maps API Key from Vite environment variables.
 * Returns empty string if not configured or using default placeholders.
 */
export function getGoogleMapsApiKey(): string {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)?.trim() || '';
  if (
    envKey &&
    envKey !== 'YOUR_GOOGLE_MAPS_API_KEY' &&
    !envKey.startsWith('AIzaSy_REPLACE')
  ) {
    return envKey;
  }
  return '';
}

/**
 * Checks whether a valid Google Maps API Key is configured.
 */
export function hasValidGoogleMapsApiKey(): boolean {
  return Boolean(getGoogleMapsApiKey());
}

/**
 * Curated ultra-clean Dark Navigation theme for Google Maps
 */
export const GOOGLE_MAPS_DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f4f4f5' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#71717a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18181b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ea580c' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#c2410c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09090b' }] },
];
