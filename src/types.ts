export type DhikrCategory =
  | 'morning'
  | 'evening'
  | 'sleep'
  | 'prayer_after'
  | 'entering_home'
  | 'leaving_home'
  | 'eating'
  | 'yawning'
  | 'toilet'
  | 'sickness'
  | 'fear'
  | 'sadness'
  | 'istikhara'
  | 'travel'
  | 'witr'
  | 'tasbih';

export interface Dhikr {
  id: string;
  text: string;
  translation?: string;
  reference: string;
  benefit?: string;
  count: number;
  category: DhikrCategory;
}

export interface Category {
  id: DhikrCategory;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  badge?: string;
  color: string;
}

export interface PrayerTime {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  nameEn: string;
  time: string; // HH:MM
}

export interface PrayerLocation {
  latitude: number;
  longitude: number;
  cityName?: string;
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  revelationType: 'Meccan' | 'Medinan' | 'مكية' | 'مدنية';
  verses: {
    number: number;
    text: string;
  }[];
}

export interface UserSettings {
  theme: 'light' | 'dark';
  fontFamily: 'ibmPlexSans' | 'tajawal';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ar' | 'en';
  prayerNotifications: boolean;
  prayerLocation?: PrayerLocation;
  prayerMethod?: number;
  prayerNotificationPrefs?: Record<PrayerTime['id'], boolean>;
  adhkarNotifications: boolean;
  generalNotifications: boolean;
  favorites: string[]; // List of Dhikr IDs
  quranProgress: {
    surahNumber: number;
    verseNumber: number;
    progressPercentage: number;
  } | null;
  masbahaCount: number;
  masbahaPhrase: string;
  quranViewMode: 'surah' | 'juz' | 'page' | 'mushaf';
  adhkarStreak: {
    count: number;
    lastCompletedDate: string; // YYYY-MM-DD
  };
  adhkarCompletedToday: {
    [key: string]: boolean | undefined;
  };
}
