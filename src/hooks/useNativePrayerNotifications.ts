import { useEffect } from 'react';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useApp } from '../context/AppContext';
import {
  PrayerTimesService,
  DEFAULT_METHOD,
  DEFAULT_LOCATION,
} from '../services/prayerTimesService';
import {
  cancelPrayerNotifications,
  reschedulePrayerNotifications,
} from '../services/nativeNotificationService';

const service = new PrayerTimesService();

/**
 * Native (Capacitor) counterpart to useAdhanScheduler.
 * On mobile it becomes the single source of truth for scheduled prayer
 * notifications (the JS-timer scheduler is skipped there). On web it no-ops,
 * leaving the existing web/PWA behavior untouched.
 */
export const useNativePrayerNotifications = (): void => {
  const { settings } = useApp();

  const lat = settings.prayerLocation?.latitude ?? DEFAULT_LOCATION.latitude;
  const lon = settings.prayerLocation?.longitude ?? DEFAULT_LOCATION.longitude;
  const method = settings.prayerMethod ?? DEFAULT_METHOD;
  const enabled = settings.prayerNotifications;
  const prefs = settings.prayerNotificationPrefs;

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (!enabled) {
        await cancelPrayerNotifications();
        return;
      }
      try {
        const data = await service.getPrayerTimes(lat, lon, method);
        if (cancelled) return;
        await reschedulePrayerNotifications({ prayers: data.prayers, prefs });
      } catch {
        // Fetch failure: the PrayerTimesCard surfaces it; keep any prior
        // schedule intact rather than wiping pending notifications.
      }
    };

    void run();

    // Refresh the schedule whenever the app returns to the foreground so the
    // next-day prayers are re-scheduled after the device has been asleep.
    let resumeHandle: PluginListenerHandle | undefined;
    if (enabled) {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void run();
      }).then((handle) => {
        resumeHandle = handle;
      });
    }

    return () => {
      cancelled = true;
      void resumeHandle?.remove();
    };
  }, [lat, lon, method, enabled, prefs]);
};
