class AdhanAudioService {
  private static audioElement: HTMLAudioElement | null = null;

  static async playSound(soundId: string, audioUrl?: string): Promise<void> {
    try {
      if (soundId === 'vibration' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
        return;
      }

      if (soundId === 'none' || soundId === 'silent') {
        return;
      }

      if (!audioUrl) {
        return;
      }

      if (!AdhanAudioService.audioElement) {
        AdhanAudioService.audioElement = new Audio();
        AdhanAudioService.audioElement.preload = 'auto';
      }

      const audio = AdhanAudioService.audioElement;
      audio.src = audioUrl;
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

  static setVolume(volume: number): void {
    const safe = Math.min(Math.max(volume / 100, 0), 1);
    if (AdhanAudioService.audioElement) {
      AdhanAudioService.audioElement.volume = safe;
    }
  }
}

export const adhanAudioService = AdhanAudioService;