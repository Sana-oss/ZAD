import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, Compass, Bell, BellOff, RotateCcw } from 'lucide-react';
import {
  PrayerTimesService,
  DEFAULT_METHOD,
  DEFAULT_LOCATION,
  DEFAULT_NOTIF_PREFS,
  PRAYER_METHODS,
  convertTo12Hour,
  getNextPrayer,
  LocationCoords,
  PrayerTimesData,
} from '../services/prayerTimesService';
import { QiblaCompass } from './QiblaCompass';
import { AdhanSettingsCard } from './AdhanSettingsCard';
import { PrayerTime } from '../types';

const service = new PrayerTimesService();

const ARABIC_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

interface PrayerCardState {
  coords: LocationCoords | null;
  cityName: string;
  prayerTimes: PrayerTimesData | null;
  loading: boolean;
  error: string | null;
  reloadKey: number;
}

export const PrayerTimesCard: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [dst, setDst] = useState(false);
  const [state, setState] = useState<PrayerCardState>({
    coords: null,
    cityName: settings.prayerLocation?.cityName || '',
    prayerTimes: null,
    loading: true,
    error: null,
    reloadKey: 0,
  });

  const method = settings.prayerMethod ?? DEFAULT_METHOD;
  const notifPrefs = settings.prayerNotificationPrefs ?? DEFAULT_NOTIF_PREFS;

  // Sync current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Resolve coordinates: saved location -> geolocation -> default
  useEffect(() => {
    let cancelled = false;
    const resolveLocation = async () => {
      if (settings.prayerLocation?.latitude && settings.prayerLocation?.longitude) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, coords: settings.prayerLocation as LocationCoords, loading: false }));
        }
        return;
      }

      try {
        const geo = await service.getLocation();
        if (cancelled) return;
        const city = await service.reverseGeocode(geo.latitude, geo.longitude);
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            coords: { latitude: geo.latitude, longitude: geo.longitude },
            cityName: city,
            loading: false,
          }));
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, coords: DEFAULT_LOCATION, cityName: DEFAULT_LOCATION.cityName || '', loading: false }));
        }
      }
    };
    resolveLocation();
    return () => {
      cancelled = true;
    };
  }, [settings.prayerLocation]);

  // Fetch prayer times
  useEffect(() => {
    if (!state.coords) return;
    let cancelled = false;

    const fetchTimes = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await service.getPrayerTimes(state.coords.latitude, state.coords.longitude, method);
        if (cancelled) return;
        setState((prev) => ({ ...prev, prayerTimes: result, loading: false }));

        // Persist location once we know it resolves (only if not already saved)
        if (!settings.prayerLocation?.cityName) {
          const loc = { latitude: state.coords.latitude, longitude: state.coords.longitude, cityName: state.cityName };
          updateSettings({ prayerLocation: loc as Parameters<typeof updateSettings>[0]['prayerLocation'] });
        }
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false, error: 'تعذر تحميل مواقيت الصلاة. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.' }));
      }
    };
    fetchTimes();
    return () => {
      cancelled = true;
    };
  }, [state.coords, method, state.reloadKey]);

  const toggleNotification = useCallback(
    (prayerId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const current = settings.prayerNotificationPrefs ?? DEFAULT_NOTIF_PREFS;
      updateSettings({
        prayerNotificationPrefs: {
          ...current,
          [prayerId]: !current[prayerId as keyof typeof DEFAULT_NOTIF_PREFS],
        },
      });
    },
    [settings.prayerNotificationPrefs, updateSettings],
  );

  const changeMethod = (id: string) => {
    updateSettings({ prayerMethod: Number(id) });
  };

  const retry = () => {
    setState((prev) => ({ ...prev, reloadKey: prev.reloadKey + 1 }));
  };

  const nowMs = currentTime.getHours() * 3600000 + currentTime.getMinutes() * 60000 + currentTime.getSeconds() * 1000;
  const nextPrayer = state.prayerTimes ? getNextPrayer(state.prayerTimes.prayers, currentTime) : null;

  const formatIslamicDate = (): string => {
    if (state.prayerTimes) return `بتاريخ ${state.prayerTimes.dateHijri} — ${state.prayerTimes.dateGregorian}`;

    const weekday = ARABIC_WEEKDAYS[currentTime.getDay()];
    const day = currentTime.getDate();
    const monthAr = ARABIC_MONTHS[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    return `${weekday} ${day} ${monthAr} ${year}`;
  };

  const formatCurrentClock = (): string => {
    const clock = convertTo12Hour(`${currentTime.getHours()}:${currentTime.getMinutes()}`);
    return `${clock.time}:${String(currentTime.getSeconds()).padStart(2, '0')} ${clock.suffix === 'PM' ? 'م' : 'ص'}`;
  };

  return (
    <div id="prayer-qibla-section" className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">مواقيت الصلاة</h3>
            <p className="text-sm text-text-secondary pt-1">{formatIslamicDate()}</p>
          </div>
        </div>
        <button
          id="btn-open-compass"
          onClick={() => document.getElementById('prayer-qibla-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-muted border border-border-custom text-sm font-medium text-text-primary transition-colors hover:bg-primary-hover/70"
        >
          <Compass className="w-4 h-4 text-primary" />
          البوصلة
        </button>
      </div>

      {/* Location + clock */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin className="w-4 h-4 text-primary" />
          <span id="prayer-location">{state.cityName || 'موقعك الحالي'}</span>
        </div>
        <div className="font-mono text-2xl font-bold text-text-primary tabular-nums" dir="ltr">
          {formatCurrentClock()}
        </div>
      </div>

      {/* Countdown banner */}
      {nextPrayer && state.prayerTimes && (
        <div
          id="prayer-countdown-banner"
          className="rounded-2xl bg-surface-muted border border-border-custom p-4 flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm text-text-secondary">
              {nextPrayer.isNextDay ? 'غداً' : 'الصلاة القادمة'}
            </p>
            <h4 className="text-xl font-bold text-text-primary mt-1">
              أذان {nextPrayer.prayer.nameAr}
            </h4>
          </div>
          <div
            id="countdown-timer"
            className="font-mono text-3xl font-bold text-primary tabular-nums"
            dir="ltr"
          >
            {nextPrayer.countdown}
          </div>
        </div>
      )}

      {/* Prayer times panel */}
      <div id="prayer-times-panel" className="rounded-2xl bg-surface shadow-sm border border-border-custom overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-custom">
          <span className="font-semibold text-text-primary">أوقات الأذان</span>
          <span className="text-xs px-2 py-1 rounded-full bg-accent-gold/15 text-accent-gold font-semibold">
            {state.prayerTimes?.methodName || 'حسب الطريقة المحددة'}
          </span>
        </div>

        {state.loading && (
          <div id="prayer-items-list" className="divide-y divide-border-custom/60">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-surface-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-surface-muted" />
                  <div className="h-3 w-32 rounded bg-surface-muted" />
                </div>
                <div className="h-4 w-16 rounded bg-surface-muted" />
              </div>
            ))}
          </div>
        )}

        {state.error && !state.loading && (
          <div className="px-4 py-10 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-text-secondary">{state.error}</p>
            <button
              id="btn-retry-prayer-times"
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        )}

        {!state.loading && !state.error && state.prayerTimes && (
          <div id="prayer-items-list" className="divide-y divide-border-custom/60">
            {state.prayerTimes.prayers.map((prayer) => {
              const clock = convertTo12Hour(prayer.time);
              const isNext = nextPrayer?.prayer.id === prayer.id;
              const enabled = notifPrefs[prayer.id] ?? true;
              return (
                <div
                  key={prayer.id}
                  id={`prayer-row-${prayer.id}`}
                  className={`flex items-center gap-4 px-4 py-4 transition-colors ${
                    isNext ? 'bg-primary border-primary text-white shadow-md scale-[1.01]' : 'hover:bg-surface-muted/60'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isNext ? 'bg-white' : nowMs < timeToMsSafe(prayer.time) ? 'bg-primary' : 'bg-text-secondary/40'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isNext ? 'text-white' : 'text-text-primary'}`}>{prayer.nameAr}</p>
                    <p className={`text-xs ${isNext ? 'text-white/80' : 'text-text-secondary'} mt-0.5`} dir="ltr">
                      {prayer.nameEn}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-lg font-bold tabular-nums ${isNext ? 'text-white' : 'text-text-primary'}`}
                    dir="ltr"
                  >
                    {clock.time} {clock.suffix === 'PM' ? 'م' : 'ص'}
                  </span>
                  <button
                    id={`btn-toggle-notif-${prayer.id}`}
                    onClick={(e) => toggleNotification(prayer.id, e)}
                    aria-label={`تفعيل تذكير ${prayer.nameAr}`}
                    className={`p-2 rounded-lg transition-colors ${
                      isNext
                        ? 'hover:bg-white/20 text-white'
                        : enabled
                          ? 'hover:bg-primary/10 text-primary'
                          : 'hover:bg-surface-muted text-text-secondary/50'
                    }`}
                  >
                    {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Method + DST row */}
        <div className="flex flex-wrap items-center gap-4 px-4 py-4 border-t border-border-custom bg-surface-muted/40">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            طريقة الحساب
            <select
              id="method-select"
              value={method}
              onChange={(e) => changeMethod(e.target.value)}
              className="rounded-lg border border-border-custom bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PRAYER_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nameAr}
                </option>
              ))}
            </select>
          </label>

          <div id="dst-toggle-row" className="flex items-center gap-2">
            <button
              id="dst-toggle"
              onClick={() => setDst((d) => !d)}
              role="switch"
              aria-checked={dst}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors ${dst ? 'bg-primary' : 'bg-text-secondary/30'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${dst ? 'translate-x-4.5' : 'translate-x-0.5'}`}
                dir="ltr"
              />
            </button>
            <span className="text-sm text-text-secondary">التوقيت الصيفي</span>
          </div>
        </div>
      </div>

      {/* Qibla compass */}
      {state.coords && <QiblaCompass location={state.coords} />}

      {/* Adhan sound settings */}
      <AdhanSettingsCard />
    </div>
  );
};

const timeToMsSafe = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60 + m) * 60 * 1000;
};