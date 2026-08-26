/**
 * Shared notification helper.
 *
 * Uses the Service Worker registration.showNotification when available so that
 * notifications are tappable and work reliably on mobile (including when the PWA
 * is in the background). Falls back to the page-notification constructor.
 */

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export function showAppNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => {
        try {
          new Notification(title, options);
        } catch {
          /* ignore */
        }
      });
    return;
  }

  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}
