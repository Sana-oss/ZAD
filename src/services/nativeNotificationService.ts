import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type LocalNotification,
  type PermissionStatus,
} from '@capacitor/local-notifications';
import { DEFAULT_NOTIF_PREFS } from './prayerTimesService';
import type { PrayerTime, UserSettings } from '../types';

const ANDROID_CHANNEL_ID = 'prayer_times';
const TITLE_PREFIX = 'حان الآن وقت صلاة ';
const BODY = 'حي على الصلاة';

const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

const cancelAllNative = async (): Promise<void> => {
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: notifications.map((n) => ({ id: n.id })),
    });
  }
};

const prayerIndex = (id: string): number => {
  const i = (PRAYER_ORDER as readonly string[]).indexOf(id);
  return i < 0 ? 0 : i;
};

const daysSinceEpoch = (d: Date): number => Math.floor(d.getTime() / 86400000);

export const notificationId = (dayIndex: number, id: string): number =>
  dayIndex * 100 + prayerIndex(id);

const prayerDateToday = (timeStr: string, dayOffset: number): Date => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
};

const permissionGranted = (status: PermissionStatus): boolean =>
  status.display === 'granted';

export const ensureNativeNotificationPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;
  if (permissionGranted(await LocalNotifications.checkPermissions())) return true;
  return permissionGranted(await LocalNotifications.requestPermissions());
};

const createPrayerChannel = async (): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'Prayer Times',
    description: 'تنبيهات مواقيت الصلاة',
    importance: 4,
    visibility: 1,
    vibration: true,
  });
};

export const cancelPrayerNotifications = async (): Promise<void> => {
  if (!isNativePlatform()) return;
  await cancelAllNative();
};

export interface NativePrayerInput {
  prayers: PrayerTime[];
  prefs?: UserSettings['prayerNotificationPrefs'];
}

const buildNotifications = (input: NativePrayerInput): LocalNotification[] => {
  const prefs = input.prefs ?? DEFAULT_NOTIF_PREFS;
  const now = Date.now();
  const list: LocalNotification[] = [];
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const dayIndex = daysSinceEpoch(new Date(Date.now() + dayOffset * 86400000));
    for (const p of input.prayers) {
      if (!p.time || !p.time.includes(':')) continue;
      if (prefs[p.id] === false) continue;
      const at = prayerDateToday(p.time, dayOffset);
      if (at.getTime() <= now) continue;
      list.push({
        id: notificationId(dayIndex, p.id),
        title: `${TITLE_PREFIX}${p.nameAr}`,
        body: BODY,
        schedule: { at, allowWhileIdle: true },
        channelId: ANDROID_CHANNEL_ID,
        extra: { prayerId: p.id },
      });
    }
  }
  return list;
};

export const schedulePrayerNotifications = async (
  input: NativePrayerInput
): Promise<void> => {
  if (!isNativePlatform()) return;
  if (!(await ensureNativeNotificationPermission())) return;
  await createPrayerChannel();
  await cancelAllNative();
  const notifications = buildNotifications(input);
  if (notifications.length === 0) return;
  await LocalNotifications.schedule({ notifications });
};

export const reschedulePrayerNotifications = async (
  input: NativePrayerInput
): Promise<void> => {
  if (!isNativePlatform()) return;
  if (!(await ensureNativeNotificationPermission())) {
    await cancelAllNative();
    return;
  }
  await schedulePrayerNotifications(input);
};
