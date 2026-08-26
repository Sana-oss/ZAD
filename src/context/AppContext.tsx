import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Dhikr } from '../types';

interface AppContextType {
  activeTab: 'home' | 'adhkar' | 'quran' | 'prayer' | 'settings' | 'hadith';
  setActiveTab: (tab: 'home' | 'adhkar' | 'quran' | 'prayer' | 'settings' | 'hadith') => void;
  activeCategory: 'morning' | 'evening' | 'sleep' | 'prayer_after' | null;
  setActiveCategory: (cat: 'morning' | 'evening' | 'sleep' | 'prayer_after' | null) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavoriteHadith: (id: string) => void;
  isFavoriteHadith: (id: string) => boolean;
  quranSearchQuery: string;
  setQuranSearchQuery: (query: string) => void;
  quranContinueTarget: { surahNumber: number; verseNumber: number } | null;
  setQuranContinueTarget: (target: { surahNumber: number; verseNumber: number } | null) => void;
  adhkarSearchQuery: string;
  setAdhkarSearchQuery: (query: string) => void;
  dhikrCounts: Record<string, number>;
  setDhikrCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  incrementDhikrCount: (id: string, max: number) => void;
  resetCategoryProgress: (cat: string) => void;
  markCategoryCompleted: (categoryId: string) => void;
  playingAudio: { id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean } | null;
  setPlayingAudio: (audio: { id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean } | null) => void;
  audioPlaying: boolean;
  setAudioPlaying: (playing: boolean) => void;
  audioQueue: { id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean }[] | null;
  setAudioQueue: (queue: { id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean }[] | null) => void;
  audioQueueIndex: number;
  setAudioQueueIndex: (idx: number) => void;
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
  prayerMethod: 2,
  prayerNotificationPrefs: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  adhkarNotifications: true,
  generalNotifications: false,
  favorites: [],
  favoriteHadiths: [],
  quranProgress: null,
  quranViewMode: 'surah',
  adhkarStreak: {
    count: 0,
    lastCompletedDate: '',
  },
  adhkarCompletedToday: {},
  adhanSettings: {
    type: 'full_adhan',
    soundOption: 'makkah',
    volume: 80,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'adhkar' | 'quran' | 'prayer' | 'settings' | 'hadith'>('home');
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'sleep' | 'prayer_after' | null>(null);
  const [quranSearchQuery, setQuranSearchQuery] = useState('');
  const [quranContinueTarget, setQuranContinueTarget] = useState<{ surahNumber: number; verseNumber: number } | null>(null);
  const [adhkarSearchQuery, setAdhkarSearchQuery] = useState('');
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [playingAudio, setPlayingAudio] = useState<{ id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean } | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioQueue, setAudioQueue] = useState<{ id: string; text: string; title: string; category: string; audioUrl?: string; isQuran?: boolean }[] | null>(null);
  const [audioQueueIndex, setAudioQueueIndex] = useState(0);
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

  const toggleFavoriteHadith = (id: string) => {
    setSettings((prev) => {
      const favoriteHadiths = prev.favoriteHadiths.includes(id)
        ? prev.favoriteHadiths.filter((favId) => favId !== id)
        : [...prev.favoriteHadiths, id];
      return { ...prev, favoriteHadiths };
    });
  };

  const isFavoriteHadith = (id: string) => settings.favoriteHadiths.includes(id);

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

  const markCategoryCompleted = (categoryId: string) => {
    updateSettings({
      adhkarCompletedToday: {
        ...settings.adhkarCompletedToday,
        [categoryId]: true,
      },
    });
  };

  // Daily reset: clear adhkarCompletedToday when a new day starts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = settings.adhkarStreak.lastCompletedDate;
    if (lastDate !== today) {
      updateSettings({ adhkarCompletedToday: {} });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update streak when all required categories are completed today
  useEffect(() => {
    const requiredCategories = ['morning', 'evening', 'sleep', 'prayer_after'];
    const allDone = requiredCategories.every(
      (cat) => settings.adhkarCompletedToday[cat] === true
    );

    if (!allDone) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = settings.adhkarStreak.lastCompletedDate;

    if (lastDate === today) return; // already updated today

    const lastDateObj = new Date(lastDate || '2000-01-01');
    const todayObj = new Date(today);
    const daysDiff = Math.floor(
      (todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak: number;
    if (daysDiff === 1) {
      newStreak = settings.adhkarStreak.count + 1;
    } else if (daysDiff > 1) {
      newStreak = 1;
    } else {
      return; // same day, already handled
    }

    updateSettings({
      adhkarStreak: {
        count: newStreak,
        lastCompletedDate: today,
      },
    });
  }, [settings.adhkarCompletedToday]); // eslint-disable-line react-hooks/exhaustive-deps

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
        toggleFavoriteHadith,
        isFavoriteHadith,
        quranSearchQuery,
        setQuranSearchQuery,
        quranContinueTarget,
        setQuranContinueTarget,
        adhkarSearchQuery,
        setAdhkarSearchQuery,
        dhikrCounts,
        setDhikrCounts,
        incrementDhikrCount,
        resetCategoryProgress,
        markCategoryCompleted,
        playingAudio,
        setPlayingAudio,
        audioPlaying,
        setAudioPlaying,
        audioQueue,
        setAudioQueue,
        audioQueueIndex,
        setAudioQueueIndex,
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
