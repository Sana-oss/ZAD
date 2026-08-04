const KAABA_LAT = (21.4225 * Math.PI) / 180;
const KAABA_LNG = (39.8262 * Math.PI) / 180;
const R = 6371;

export interface CompassBearing {
  bearing: number;
  distance: number;
  formatted: string;
}

export function calculateQibla(lat: number, lng: number): CompassBearing {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const dLng = KAABA_LNG - lngRad;
  const y = Math.sin(dLng) * Math.cos(KAABA_LAT);
  const x =
    Math.cos(latRad) * Math.sin(KAABA_LAT) -
    Math.sin(latRad) * Math.cos(KAABA_LAT) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = (bearing + 360) % 360;

  const dLat = KAABA_LAT - latRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(latRad) * Math.cos(KAABA_LAT) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    bearing: Math.round(normalized * 10) / 10,
    distance: Math.round(distance),
    formatted: formatDistance(Math.round(distance)),
  };
}

function formatDistance(d: number): string {
  if (d >= 1000) {
    const km = (d / 1000).toFixed(1).replace(/\.0$/, '');
    return `${km} كم`;
  }
  return `${d.toLocaleString('ar-SA')} كم`;
}

export type OrientationPermission = 'granted' | 'denied' | 'unavailable';

export async function requestOrientationPermission(): Promise<OrientationPermission> {
  const DOE = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<PermissionState>;
  };

  if (typeof DOE.requestPermission === 'function') {
    try {
      const state = await DOE.requestPermission();
      return state === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }

  return 'unavailable';
}

export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchstart' in window);
}
