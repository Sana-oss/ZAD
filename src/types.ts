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

export type HadithGrade = 'Sahih' | 'Hasan' | 'Daif' | 'Unknown';

export interface NarratorProfile {
  fullName: string;
  totalNarrations: number;
  deathYear: string;
}

export interface BookMetadata {
  author: string;
  totalCount: number;
  authenticityNotes: string;
}

export interface HadithCommentary {
  complexTerms: Record<string, string>;
  keyLessons: string[];
  practicalApplications: string[];
}

export interface Hadith {
  id: string;
  textAr: string;
  textEn: string;
  narrator: string;
  book: string;
  grade: HadithGrade;
  reference: string;
  tags: string[];
  narratorProfile?: NarratorProfile;
  bookMetadata?: BookMetadata;
  commentary?: HadithCommentary;
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
  favoriteHadiths: string[]; // List of Hadith IDs
  quranProgress: {
    surahNumber: number;
    verseNumber: number;
    progressPercentage: number;
  } | null;
  masbahaCount: number;
  masbahaPhrase: string;
  misbahaStats: {
    todayCount: number;
    lastResetDate: string; // YYYY-MM-DD
  };
  quranViewMode: 'surah' | 'juz' | 'page' | 'mushaf';
  adhkarStreak: {
    count: number;
    lastCompletedDate: string; // YYYY-MM-DD
  };
  adhkarCompletedToday: {
    [key: string]: boolean | undefined;
  };
}
