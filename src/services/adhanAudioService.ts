import { ADHAN_SOUND_OPTIONS } from '../data/adhanSounds';

class AdhanAudioService {
  private static audioElement: HTMLAudioElement | null = null;
  private static volumeLevel = 80; // percent — kept here so it applies even before the element exists.

  /** Resolve the audio file for a saved sound option id ('makkah', 'vibration', ...). */
  static resolveUrl(soundId: string): string | undefined {
    return ADHAN_SOUND_OPTIONS.find((s) => s.id === soundId)?.audioUrl;
  }

  static supportsVibration(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }

  /**
   * Play a sound option by id. Non-audio options are handled explicitly:
   * - 'vibration': device vibration pattern
   * - 'silent' / 'none': no-op (notification-only alerting)
   */
  static async playSound(soundId: string, audioUrl?: string): Promise<void> {
    try {
      if (soundId === 'vibration') {
        if (AdhanAudioService.supportsVibration()) {
          navigator.vibrate([500, 200, 500, 200, 500]);
        }
        return;
      }

      if (soundId === 'none' || soundId === 'silent') {
        return;
      }

      const url = audioUrl ?? AdhanAudioService.resolveUrl(soundId);
      if (!url) {
        return;
      }

      if (!AdhanAudioService.audioElement) {
        AdhanAudioService.audioElement = new Audio();
        AdhanAudioService.audioElement.preload = 'auto';
      }

      const audio = AdhanAudioService.audioElement;
      // Apply the stored level on every playback (fixes first-play ignoring the slider).
      audio.volume = Math.min(Math.max(AdhanAudioService.volumeLevel / 100, 0), 1);
      audio.src = url;
      audio.load();

      try {
        await audio.play();
      } catch {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('حان وقت الصلاة', {
            body: 'تعذر تشغيل صوت الأذان. الرجاء التحقق من مستوى الصوت.',
          });
        }
      }
    } catch (error) {
      console.error('Audio error:', error);
    }
  }

  static stopSound(): void {
    if (AdhanAudioService.audioElement) {
      AdhanAudioService.audioElement.pause();
      AdhanAudioService.audioElement.currentTime = 0;
    }
  }

  /**
   * Warm up audio on the first user gesture so later programmatic playback
   * (at prayer time) is allowed by browser autoplay policies.
   */
  static unlock(): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        void ctx.resume().finally(() => void ctx.close());
      }
    } catch {
      // ignore — best effort only
    }
  }

  static setVolume(volume: number): void {
    const safe = Math.min(Math.max(volume / 100, 0), 1);
    AdhanAudioService.volumeLevel = volume;
    if (AdhanAudioService.audioElement) {
      AdhanAudioService.audioElement.volume = safe;
    }
  }
}

export const adhanAudioService = AdhanAudioService;
