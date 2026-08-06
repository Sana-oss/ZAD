export interface AdhanSound {
  id: string;
  nameAr: string;
  category: 'basic' | 'muezzin';
  isNew?: boolean;
  audioUrl?: string;
}

export const ADHAN_SOUND_OPTIONS: AdhanSound[] = [
  {
    id: 'none',
    nameAr: 'بدون صوت',
    category: 'basic',
  },
  {
    id: 'silent',
    nameAr: 'إخطار صامت',
    category: 'basic',
  },
  {
    id: 'vibration',
    nameAr: 'اهتزاز فقط',
    category: 'basic',
  },


  {
    id: 'mishari_alafasy',
    nameAr: 'مشاري راشد العفاسي',
    category: 'muezzin',
    audioUrl: '/sounds/mishari-alafasy.mp3',
  },
  {
    id: 'madinah',
    nameAr: 'أذان المدينة المنورة',
    category: 'muezzin',
    audioUrl: '/sounds/madinah.mp3',
  },
  {
    id: 'makkah',
    nameAr: 'أذان مكة المكرمة',
    category: 'muezzin',
    audioUrl: '/sounds/makkah.mp3',
  },
  {
    id: 'islam_subhi',
    nameAr: 'الشيخ إسلام صبحي',
    category: 'muezzin',
    audioUrl: '/sounds/asalam-subhi.mp3',
    isNew: true,
  },
  {
    id: 'alaqsa',
    nameAr: 'أذان المسجد الأقصى',
    category: 'muezzin',
    audioUrl: '/sounds/alaqsa.mp3',
    isNew: true,
  },
  {
    id: 'ahmad_alkurdi',
    nameAr: 'أحمد الكردي',
    category: 'muezzin',
    audioUrl: '/sounds/ahmad-alkurdi.mp3',
    isNew: true,
  },
  {
    id: 'yasser_aldawsari',
    nameAr: 'ياسر الدوسري',
    category: 'muezzin',
    audioUrl: '/sounds/yasir-aldawsari.mp3',
  },
];

export const ADHAN_TYPES = [
  { id: 'takbeer', labelAr: 'التكبير' },
  { id: 'full_adhan', labelAr: 'الأذان كاملاً' },
  { id: 'call', labelAr: 'النداء فقط' },
];