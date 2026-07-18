import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Dhikr } from '../types';

interface AppContextType {
  activeTab: 'home' | 'adhkar' | 'quran' | 'prayer' | 'settings';
  setActiveTab: (tab: 'home' | 'adhkar' | 'quran' | 'prayer' | 'settings') => void;
  activeCategory: 'morning' | 'evening' | 'sleep' | 'prayer_after' | null;
  setActiveCategory: (cat: 'morning' | 'evening' | 'sleep' | 'prayer_after' | null) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  incrementMasbaha: () => void;
  resetMasbaha: () => void;
  changeMasbahaPhrase: (phrase: string) => void;
  quranSearchQuery: string;
  setQuranSearchQuery: (query: string) => void;
  adhkarSearchQuery: string;
  setAdhkarSearchQuery: (query: string) => void;
  dhikrCounts: Record<string, number>;
  setDhikrCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  incrementDhikrCount: (id: string, max: number) => void;
  resetCategoryProgress: (cat: string) => void;
  playingAudio: { id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean } | null;
  setPlayingAudio: (audio: { id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean } | null) => void;
  audioPlaying: boolean;
  setAudioPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  reciter: 'alafasy' | 'abdulbasit' | 'husary';
  setReciter: (reciter: 'alafasy' | 'abdulbasit' | 'husary') => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontFamily: 'ibmPlexSans',
  fontSize: 'medium',
  language: 'ar',
  prayerNotifications: true,
  adhkarNotifications: true,
  generalNotifications: false,
  favorites: [],
  quranProgress: {
    surahNumber: 18,
    verseNumber: 45,
    progressPercentage: 65,
  },
  masbahaCount: 0,
  masbahaPhrase: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'adhkar' | 'quran' | 'prayer' | 'settings'>('home');
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'sleep' | 'prayer_after' | null>(null);
  const [quranSearchQuery, setQuranSearchQuery] = useState('');
  const [adhkarSearchQuery, setAdhkarSearchQuery] = useState('');
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [playingAudio, setPlayingAudio] = useState<{ id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean } | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [reciter, setReciter] = useState<'alafasy' | 'abdulbasit' | 'husary'>('alafasy');

  // Load settings from LocalStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('zad_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Sync settings to LocalStorage
  useEffect(() => {
    localStorage.setItem('zad_settings', JSON.stringify(settings));
    
    // Apply theme
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font-family
    if (settings.fontFamily === 'tajawal') {
      root.style.setProperty('--font-family-arabic', '"Tajawal", sans-serif');
    } else {
      root.style.setProperty('--font-family-arabic', '"IBM Plex Sans Arabic", sans-serif');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const toggleFavorite = (id: string) => {
    setSettings((prev) => {
      const favorites = prev.favorites.includes(id)
        ? prev.favorites.filter((favId) => favId !== id)
        : [...prev.favorites, id];
      return { ...prev, favorites };
    });
  };

  const isFavorite = (id: string) => settings.favorites.includes(id);

  const incrementMasbaha = () => {
    updateSettings({ masbahaCount: settings.masbahaCount + 1 });
  };

  const resetMasbaha = () => {
    updateSettings({ masbahaCount: 0 });
  };

  const changeMasbahaPhrase = (phrase: string) => {
    updateSettings({ masbahaPhrase: phrase });
  };

  const incrementDhikrCount = (id: string, max: number) => {
    setDhikrCounts((prev) => {
      const current = prev[id] || 0;
      if (current >= max) return prev; // already done
      return { ...prev, [id]: current + 1 };
    });
  };

  const resetCategoryProgress = (category: string) => {
    setDhikrCounts((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        if (key.startsWith(category + '_') || key.startsWith(category[0])) {
          // This is a simple cleanup for specific categories
          delete copy[key];
        }
      });
      return copy;
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeCategory,
        setActiveCategory,
        settings,
        updateSettings,
        toggleFavorite,
        isFavorite,
        incrementMasbaha,
        resetMasbaha,
        changeMasbahaPhrase,
        quranSearchQuery,
        setQuranSearchQuery,
        adhkarSearchQuery,
        setAdhkarSearchQuery,
        dhikrCounts,
        setDhikrCounts,
        incrementDhikrCount,
        resetCategoryProgress,
        playingAudio,
        setPlayingAudio,
        audioPlaying,
        setAudioPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        reciter,
        setReciter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
