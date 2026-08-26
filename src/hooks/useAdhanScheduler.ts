import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  PrayerTimesService,
  DEFAULT_METHOD,
  DEFAULT_LOCATION,
  DEFAULT_NOTIF_PREFS,
  timeToMs,
} from '../services/prayerTimesService';
import { adhanAudioService } from '../services/adhanAudioService';
import { showAppNotification } from '../services/notify';
import type { PrayerTime } from '../types';

const service = new PrayerTimesService();

const DEFAULT_ADHAN = { soundOption: 'makkah' };

const nowMsOfDay = (d: Date): number =>
  d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000;

/**
 * Plays the user's selected adhan when a prayer time arrives while the app is open:
 * - chosen muezzin/basic sound option, honoring volume
 * - 'vibration' -> device vibration, 'silent'/'none' -> notification only
 * - respects the master toggle and per-prayer notification preferences
 */
export const useAdhanScheduler = (): void => {
  const { settings } = useApp();

  const [prayers, setPrayers] = useState<PrayerTime[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Latest values in refs so the 1s interval never runs on stale closures.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const prayersRef = useRef(prayers);
  prayersRef.current = prayers;

  const lastTickRef = useRef<number | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const loadedDateRef = useRef<string>('');

  const lat = settings.prayerLocation?.latitude ?? DEFAULT_LOCATION.latitude;
  const lon = settings.prayerLocation?.longitude ?? DEFAULT_LOCATION.longitude;
  const method = settings.prayerMethod ?? DEFAULT_METHOD;

  // Load today's times whenever location/method changes or the day rolls over.
  useEffect(() => {
    let cancelled = false;
    service
      .getPrayerTimes(lat, lon, method)
      .then((data) => {
        if (cancelled) return;
        loadedDateRef.current = new Date().toDateString();
        setPrayers(data.prayers);
        // A new day means fresh firing slots.
        firedRef.current.clear();
      })
      .catch(() => {
        // Silent: the card surfaces fetch errors; retry happens on next dependency change.
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, method, reloadKey]);

  // Unlock audio on first user gesture (browser autoplay policy).
  useEffect(() => {
    const unlock = () => adhanAudioService.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // The scheduler loop: fire each enabled prayer exactly once as its time is crossed.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const nowMs = nowMsOfDay(now);
      const lastMs = lastTickRef.current;
      lastTickRef.current = nowMs;

      if (!prayersRef.current) return;

      // Day rollover -> refetch tomorrow's times and reset firing slots.
      if (loadedDateRef.current && loadedDateRef.current !== now.toDateString()) {
        setReloadKey((k) => k + 1);
        return;
      }

      // First tick after mount/load only establishes the baseline
      // so past prayers are not replayed.
      if (lastMs === null) return;

      const current = settingsRef.current;
      if (!current.prayerNotifications) return;

      const prefs = current.prayerNotificationPrefs ?? DEFAULT_NOTIF_PREFS;
      const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      for (const prayer of prayersRef.current) {
        if (!prayer.time || !prayer.time.includes(':')) continue;
        const t = timeToMs(prayer.time);
        if (!(t > lastMs && t <= nowMs)) continue;

        const key = `${dayKey}:${prayer.id}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);

        if (prefs[prayer.id] === false) continue;

        const adhanSettings = current.adhanSettings ?? DEFAULT_ADHAN;
        void adhanAudioService.playSound(adhanSettings.soundOption);

        if ('Notification' in window && Notification.permission === 'granted') {
          void showAppNotification(`حان الآن وقت ${prayer.nameAr}`, {
            body:
              adhanSettings.soundOption === 'vibration'
                ? 'التنبيه بالاهتزاز'
                : adhanSettings.soundOption === 'silent' || adhanSettings.soundOption === 'none'
                  ? 'تنبيه صامت — حان وقت الصلاة'
                  : `أذان ${prayer.nameAr}`,
            icon: `${import.meta.env.BASE_URL}icon-192.png`,
            dir: 'rtl',
          });
        }
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);
};
