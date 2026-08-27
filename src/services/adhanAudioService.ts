import { ADHAN_SOUND_OPTIONS } from '../data/adhanSounds';
import { showAppNotification } from './notify';

class AdhanAudioService {
  private static audioElement: HTMLAudioElement | null = null;
  private static volumeLevel = 80; // percent — kept here so it applies even before the element exists.

  /** Prefix a relative audio path with the app base path (e.g. /ZAD/ on GH Pages). */
  private static prefixBase(url: string): string {
    // Absolute / inline / object URLs are used as-is.
    if (/^(https?:|data:|blob:)/.test(url)) return url;
    // Relative paths must be prefixed with the app base path.
    const base = import.meta.env.BASE_URL || '/';
    return base + url.replace(/^\//, '');
  }

  /** Resolve the audio file for a saved sound option id ('makkah', 'vibration', ...). */
  static resolveUrl(soundId: string): string | undefined {
    const url = ADHAN_SOUND_OPTIONS.find((s) => s.id === soundId)?.audioUrl;
    if (!url) return undefined;
    return AdhanAudioService.prefixBase(url);
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

      // When an explicit URL is supplied (e.g. from the settings preview buttons) it
      // is a raw relative path and still needs the base prefix on GH Pages.
      const url = audioUrl
        ? AdhanAudioService.prefixBase(audioUrl)
        : AdhanAudioService.resolveUrl(soundId);
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
        void showAppNotification('حان وقت الصلاة', {
          body: 'تعذر تشغيل صوت الأذان. الرجاء التحقق من مستوى الصوت.',
          icon: `${import.meta.env.BASE_URL}icon-192.png`,
          dir: 'rtl',
        });
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
   * (at prayer time) is allowed by browser autoplay policies. We prime the
   * persistent HTMLAudioElement (the one actually used for playback) rather
   * than a throwaway AudioContext, since the latter does not arm the element.
   */
  static unlock(): void {
    try {
      if (!AdhanAudioService.audioElement) {
        AdhanAudioService.audioElement = new Audio();
        AdhanAudioService.audioElement.preload = 'auto';
        AdhanAudioService.audioElement.volume = Math.min(Math.max(AdhanAudioService.volumeLevel / 100, 0), 1);
      }
      const audio = AdhanAudioService.audioElement;
      const url = AdhanAudioService.resolveUrl('makkah');
      if (url) {
        // Muted silent playback inside the gesture arms the element for
        // sticky-activation policies without an audible blip.
        audio.muted = true;
        audio.src = url;
        void audio
          .play()
          .then(() => {
            audio.pause();
            audio.muted = false;
          })
          .catch(() => {
            audio.muted = false;
          });
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
