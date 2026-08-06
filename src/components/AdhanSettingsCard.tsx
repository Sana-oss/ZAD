import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Volume1, Vibrate, BellOff, Music, Play, Square, BadgeCheck } from 'lucide-react';
import { ADHAN_TYPES, ADHAN_SOUND_OPTIONS } from '../data/adhanSounds';
import { adhanAudioService } from '../services/adhanAudioService';

export const AdhanSettingsCard: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const adhanSettings = settings.adhanSettings ?? {
    type: 'full_adhan' as const,
    soundOption: 'makkah',
    volume: 80,
  };

  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(adhanSettings.volume);

  const handleTypeChange = (typeId: string) => {
    updateSettings({
      adhanSettings: {
        ...adhanSettings,
        type: typeId as 'takbeer' | 'full_adhan' | 'call',
      },
    });
  };

  const handleSoundChange = (soundId: string) => {
    updateSettings({
      adhanSettings: {
        ...adhanSettings,
        soundOption: soundId,
      },
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    adhanAudioService.setVolume(newVolume);
    updateSettings({
      adhanSettings: {
        ...adhanSettings,
        volume: newVolume,
      },
    });
  };

  const handlePlaySound = async (soundId: string, audioUrl?: string) => {
    if (playingSound === soundId) {
      adhanAudioService.stopSound();
      setPlayingSound(null);
    } else {
      setPlayingSound(soundId);
      adhanAudioService.setVolume(volume);
      await adhanAudioService.playSound(soundId, audioUrl);
      setTimeout(() => setPlayingSound(null), 30000);
    }
  };

  const basicSounds = ADHAN_SOUND_OPTIONS.filter((s) => s.category === 'basic');
  const muezzinSounds = ADHAN_SOUND_OPTIONS.filter((s) => s.category === 'muezzin');

  return (
    <div
      className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-md"
      id="adhan-settings-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">إعدادات صوت الأذان</h3>
      </div>

      <div className="mb-6" id="adhan-type-tabs">
        <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">
          نوع الأذان
        </p>
        <div className="flex gap-2 flex-wrap">
          {ADHAN_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active-press ${
                adhanSettings.type === type.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-muted text-text-secondary hover:bg-primary/10'
              }`}
              id={`tab-${type.id}`}
            >
              <span>{type.labelAr}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6" id="volume-control">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            مستوى الصوت
          </p>
          <span className="text-sm font-bold text-primary">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full h-2 bg-border-custom rounded-full appearance-none cursor-pointer"
          id="volume-slider"
        />
      </div>

      <div className="mb-6" id="basic-sounds-section">
        <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">
          طريقة التنبيه
        </p>
        <div className="space-y-2">
          {basicSounds.map((sound) => (
            <div
              key={sound.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                adhanSettings.soundOption === sound.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border-custom bg-surface-muted hover:border-primary/30'
              }`}
              onClick={() => handleSoundChange(sound.id)}
              id={`sound-${sound.id}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-text-secondary">
                  {sound.id === 'none' && <BellOff className="h-5 w-5" />}
                  {sound.id === 'silent' && <Volume1 className="h-5 w-5" />}
                  {sound.id === 'vibration' && <Vibrate className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{sound.nameAr}</p>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 transition-all ${
                    adhanSettings.soundOption === sound.id
                      ? 'border-primary bg-primary'
                      : 'border-border-custom'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="muezzin-sounds-section">
        <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">
          أصوات المؤذنين
        </p>
        <div className="space-y-2">
          {muezzinSounds.map((sound) => (
            <div
              key={sound.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                adhanSettings.soundOption === sound.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border-custom bg-surface-muted hover:border-primary/30'
              }`}
              onClick={() => handleSoundChange(sound.id)}
              id={`sound-${sound.id}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Music className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{sound.nameAr}</p>
                    {sound.isNew && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full text-[10px] font-bold">
                        <BadgeCheck className="h-3 w-3" />
                        جديد
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 transition-all ${
                    adhanSettings.soundOption === sound.id
                      ? 'border-primary bg-primary'
                      : 'border-border-custom'
                  }`}
                />
              </div>

              {sound.audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaySound(sound.id, sound.audioUrl);
                  }}
                  className="ml-2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors active-press"
                  title="استمع"
                  id={`play-${sound.id}`}
                >
                  {playingSound === sound.id ? (
                    <Square className="h-4 w-4 text-red-500" />
                  ) : (
                    <Play className="h-4 w-4 text-primary" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        سيتم تشغيل الأذان المختار عند حلول وقت الصلاة
      </p>
    </div>
  );
};