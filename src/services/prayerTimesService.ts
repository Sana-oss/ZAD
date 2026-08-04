import { PrayerTime } from '../types';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  cityName?: string;
}

export interface PrayerTimesData {
  prayers: PrayerTime[];
  dateHijri: string;
  dateGregorian: string;
  methodName: string;
  qiblaDegrees: number;
  timestamp: number;
}

export interface NextPrayerInfo {
  prayer: PrayerTime;
  countdown: string;
  isNextDay: boolean;
}

export interface PrayerMethod {
  id: number;
  nameAr: string;
  nameEn: string;
}

export const DEFAULT_METHOD = 2;

export const PRAYER_METHODS: PrayerMethod[] = [
  { id: 3, nameAr: 'رابطة العالم الإسلامي', nameEn: 'Muslim World League' },
  { id: 2, nameAr: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)', nameEn: 'Islamic Society of North America (ISNA)' },
  { id: 5, nameAr: 'أم القرى، مكة المكرمة', nameEn: 'Umm Al-Qura, Makkah' },
  { id: 4, nameAr: 'الاتحاد الإسلامي لفرنسا (UOIF)', nameEn: 'Union of Islamic Organizations of France (UOIF)' },
  { id: 1, nameAr: 'جامعة كراتشي', nameEn: 'University of Karachi' },
  { id: 8, nameAr: 'الهيئة المصرية العامة للمساحة', nameEn: 'Egyptian General Authority of Survey' },
];

export const DEFAULT_LOCATION: LocationCoords = {
  latitude: 24.7136,
  longitude: 46.6753,
  cityName: 'الرياض',
};

export const DEFAULT_NOTIF_PREFS: Record<PrayerTime['id'], boolean> = {
  fajr: true,
  sunrise: false,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

export const formatDateKey = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy}`;
};

class PrayerTimesCache {
  private prefix = 'prayer_times_cache_v1_';
  private ttl = 86400000;

  get(key: string): PrayerTimesData | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as { data: PrayerTimesData; cachedAt: number };
      if (Date.now() - entry.cachedAt > this.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  set(key: string, data: PrayerTimesData): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify({ data, cachedAt: Date.now() }));
    } catch {
      // storage full / unavailable: fail silently, next fetch will retry
    }
  }
}

export class AladhanPrayerTimesProvider {
  private baseUrl = 'https://api.aladhan.com/v1';
  private cache = new PrayerTimesCache();

  async getPrayerTimes(latitude: number, longitude: number, method: number = DEFAULT_METHOD): Promise<PrayerTimesData> {
    const dateKey = formatDateKey(new Date());
    const cacheKey = `timings_${latitude.toFixed(4)},${longitude.toFixed(4)}_${dateKey}_m${method}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/timings/${dateKey}?latitude=${latitude}&longitude=${longitude}&method=${method}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Aladhan API error: ${res.status}`);
    }
    const json = await res.json();
    const data = json.data;

    const prayers: PrayerTime[] = [
      { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: data.timings.Fajr },
      { id: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', time: data.timings.Sunrise },
      { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: data.timings.Dhuhr },
      { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: data.timings.Asr },
      { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: data.timings.Maghrib },
      { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: data.timings.Isha },
    ];

    const methodName = this.resolveMethodName(method, data.meta?.method?.name);

    const result: PrayerTimesData = {
      prayers,
      dateHijri: `${data.date.hijri.day} ${data.date.hijri.month.ar} ${data.date.hijri.year} هـ`,
      dateGregorian: `${data.date.gregorian.day}-${data.date.gregorian.month.number}-${data.date.gregorian.year}`,
      methodName,
      qiblaDegrees: typeof data.meta?.qibla === 'number' ? data.meta.qibla : 135.4,
      timestamp: Date.now(),
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  private resolveMethodName(id: number, apiName?: string): string {
    const known = PRAYER_METHODS.find((m) => m.id === id);
    return known ? known.nameAr : apiName || 'غير محدد';
  }
}

export class GeolocationService {
  getCurrentPosition(): Promise<LocationCoords> {
    return new Promise<LocationCoords>((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
      );
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ar`;
      const res = await fetch(url);
      if (!res.ok) return '';
      const json = await res.json();
      const a = json.address || {};
      return (
        a.city || a.town || a.village || a.municipality || a.county || a.state || ''
      );
    } catch {
      return '';
    }
  }
}

export const timeToMs = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60 + m) * 60 * 1000;
};

export const convertTo12Hour = (timeStr: string): { time: string; suffix: 'AM' | 'PM' } => {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, suffix };
};

export const getNextPrayer = (prayers: PrayerTime[], now: Date): NextPrayerInfo => {
  const nowMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;

  const sorted = [...prayers]
    .filter((p) => p.time && p.time.includes(':'))
    .sort((a, b) => timeToMs(a.time) - timeToMs(b.time));

  const next = sorted.find((p) => timeToMs(p.time) > nowMs);
  if (next) {
    const diff = timeToMs(next.time) - nowMs;
    return { prayer: next, countdown: formatCountdown(diff), isNextDay: false };
  }

  const first = sorted[0];
  const diff = timeToMs(first.time) + 24 * 3600000 - nowMs;
  return { prayer: first, countdown: formatCountdown(diff), isNextDay: true };
};

const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export class PrayerTimesService {
  provider = new AladhanPrayerTimesProvider();
  geolocation = new GeolocationService();

  getPrayerTimes(latitude: number, longitude: number, method?: number): Promise<PrayerTimesData> {
    return this.provider.getPrayerTimes(latitude, longitude, method);
  }

  getLocation(): Promise<LocationCoords> {
    return this.geolocation.getCurrentPosition();
  }

  reverseGeocode(latitude: number, longitude: number): Promise<string> {
    return this.geolocation.reverseGeocode(latitude, longitude);
  }
}

export const prayerTimesService = new PrayerTimesService();
