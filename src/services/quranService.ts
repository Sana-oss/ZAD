import { QURAN_SURAS } from '../data/quran';

export interface QuranChapter {
  id: number;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  revelationPlace: string;
  revelationOrder: number;
  bismillahPre: boolean;
  translatedName: string;
}

export interface QuranVerse {
  id: number;
  verseNumber: number;
  verseKey: string;
  textUthmani: string;
  translationText?: string;
  audioUrl?: string;
}

export interface QuranChapterDetail extends QuranChapter {
  pages: number[];
}

export interface TafsirData {
  resourceId: number;
  text: string;
}

export interface QuranSearchResult {
  verseKey: string;
  textUthmani: string;
  translationText: string;
}

export interface IQuranProvider {
  getChapters(): Promise<QuranChapter[]>;
  getChapterDetails(chapterId: number): Promise<QuranChapterDetail>;
  getVerses(chapterId: number, translationId?: number): Promise<QuranVerse[]>;
  getTafsir(chapterId: number, verseNumber: number, tafsirId?: number): Promise<TafsirData>;
  getChapterAudio(chapterId: number, reciterId?: number): Promise<string>;
  searchQuran(query: string): Promise<QuranSearchResult[]>;
}

// Simple In-Memory / LocalStorage Cache
class QuranCache {
  private static PREFIX = 'quran_cache_';

  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.PREFIX + key);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Expire cache after 1 day (86400000ms) to ensure fresh data
        if (Date.now() - parsed.timestamp < 86400000) {
          return parsed.data as T;
        }
        localStorage.removeItem(this.PREFIX + key);
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }

  static set<T>(key: string, data: T): void {
    try {
      const payload = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(this.PREFIX + key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }
}

// 1. Quran.com API Implementation
export class QuranComProvider implements IQuranProvider {
  private baseUrl = 'https://api.quran.com/api/v4';

  async getChapters(): Promise<QuranChapter[]> {
    const cacheKey = 'chapters';
    const cached = QuranCache.get<QuranChapter[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${this.baseUrl}/chapters?language=ar`);
      if (!res.ok) throw new Error('Failed to fetch chapters');
      const data = await res.json();
      
      const chapters: QuranChapter[] = data.chapters.map((ch: any) => ({
        id: ch.id,
        nameSimple: ch.name_simple,
        nameComplex: ch.name_complex,
        nameArabic: ch.name_arabic,
        versesCount: ch.verses_count,
        revelationPlace: ch.revelation_place,
        revelationOrder: ch.revelation_order,
        bismillahPre: ch.bismillah_pre,
        translatedName: ch.translated_name?.name || ch.name_simple,
      }));

      QuranCache.set(cacheKey, chapters);
      return chapters;
    } catch (err) {
      console.error('Quran.com API Error fetching chapters, falling back:', err);
      throw err;
    }
  }

  async getChapterDetails(chapterId: number): Promise<QuranChapterDetail> {
    const cacheKey = `chapter_detail_${chapterId}`;
    const cached = QuranCache.get<QuranChapterDetail>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${this.baseUrl}/chapters/${chapterId}?language=ar`);
      if (!res.ok) throw new Error('Failed to fetch chapter details');
      const data = await res.json();
      const ch = data.chapter;

      const detail: QuranChapterDetail = {
        id: ch.id,
        nameSimple: ch.name_simple,
        nameComplex: ch.name_complex,
        nameArabic: ch.name_arabic,
        versesCount: ch.verses_count,
        revelationPlace: ch.revelation_place,
        revelationOrder: ch.revelation_order,
        bismillahPre: ch.bismillah_pre,
        translatedName: ch.translated_name?.name || ch.name_simple,
        pages: ch.pages || [1, 1],
      };

      QuranCache.set(cacheKey, detail);
      return detail;
    } catch (err) {
      console.error(`Quran.com API Error fetching chapter ${chapterId} details, falling back:`, err);
      throw err;
    }
  }

  async getVerses(chapterId: number, translationId = 131): Promise<QuranVerse[]> {
    const cacheKey = `verses_${chapterId}_trans_${translationId}`;
    const cached = QuranCache.get<QuranVerse[]>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch text_qpc_hafs and translations from Quran.com
      // Setting per_page to 300 to fetch all verses of any surah in a single request (longest is Al-Baqarah with 286 verses)
      const res = await fetch(
        `${this.baseUrl}/verses/by_chapter/${chapterId}?language=ar&words=false&translations=${translationId}&fields=text_qpc_hafs&per_page=300`
      );
      if (!res.ok) throw new Error('Failed to fetch verses');
      const data = await res.json();

      const verses: QuranVerse[] = data.verses.map((v: any) => {
        // Sanitize the text:
        // 1. Remove the appended verse number from text_qpc_hafs (e.g., " ٥")
        // 2. Remove ZWNJ, ZWJ, ZWS which break text shaping
        // 3. Remove Tatweel (Kashida)
        let cleanText = v.text_qpc_hafs || '';
        cleanText = cleanText.replace(/[\s\u00A0]*[\u0660-\u0669]+$/, '');
        cleanText = cleanText.replace(/[\u200B-\u200D\uFEFF]/g, '');
        cleanText = cleanText.replace(/\u0640/g, '');

        return {
          id: v.id,
          verseNumber: v.verse_number,
          verseKey: v.verse_key,
          textUthmani: cleanText,
          translationText: v.translations?.[0]?.text || '',
          audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${String(chapterId).padStart(3, '0')}${String(v.verse_number).padStart(3, '0')}.mp3`,
        };
      });

      QuranCache.set(cacheKey, verses);
      return verses;
    } catch (err) {
      console.error(`Quran.com API Error fetching verses for chapter ${chapterId}, falling back:`, err);
      throw err;
    }
  }

  async getTafsir(chapterId: number, verseNumber: number, tafsirId = 169): Promise<TafsirData> {
    // 169 is Tafsir Al-Saddi (Arabic) or Tafsir Ibn Kathir
    const cacheKey = `tafsir_${chapterId}_${verseNumber}_${tafsirId}`;
    const cached = QuranCache.get<TafsirData>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${this.baseUrl}/tafsirs/${tafsirId}/by_ayah/${chapterId}:${verseNumber}`);
      if (!res.ok) throw new Error('Failed to fetch tafsir');
      const data = await res.json();

      const tafsir: TafsirData = {
        resourceId: tafsirId,
        text: data.tafsir?.text || 'التفسير غير متوفر حالياً.',
      };

      QuranCache.set(cacheKey, tafsir);
      return tafsir;
    } catch (err) {
      console.error(`Quran.com API Error fetching tafsir for ${chapterId}:${verseNumber}:`, err);
      throw err;
    }
  }

  async getChapterAudio(chapterId: number, reciterId = 7): Promise<string> {
    const cacheKey = `audio_chapter_${chapterId}_reciter_${reciterId}`;
    const cached = QuranCache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${this.baseUrl}/chapter_recitations/${reciterId}/${chapterId}`);
      if (!res.ok) throw new Error('Failed to fetch chapter audio');
      const data = await res.json();
      const audioUrl = data.audio_file?.audio_url || '';

      QuranCache.set(cacheKey, audioUrl);
      return audioUrl;
    } catch (err) {
      console.error(`Quran.com API Error fetching audio for chapter ${chapterId}, falling back:`, err);
      throw err;
    }
  }

  async searchQuran(query: string): Promise<QuranSearchResult[]> {
    const cacheKey = `search_${encodeURIComponent(query)}`;
    const cached = QuranCache.get<QuranSearchResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`${this.baseUrl}/search?query=${encodeURIComponent(query)}&size=15&language=ar`);
      if (!res.ok) throw new Error('Failed to search Quran');
      const data = await res.json();
      
      const results: QuranSearchResult[] = (data.search?.results || []).map((r: any) => ({
        verseKey: r.verse_key,
        textUthmani: r.text || '',
        translationText: r.translations?.[0]?.text || '',
      }));

      QuranCache.set(cacheKey, results);
      return results;
    } catch (err) {
      console.error('Quran.com API Error searching Quran:', err);
      throw err;
    }
  }
}

// 2. Offline Fallback Local Provider
export class LocalQuranProvider implements IQuranProvider {
  async getChapters(): Promise<QuranChapter[]> {
    return QURAN_SURAS.map((s) => ({
      id: s.number,
      nameSimple: s.englishName,
      nameComplex: s.englishName,
      nameArabic: s.name,
      versesCount: s.verses.length,
      revelationPlace: s.revelationType === 'مكية' || s.revelationType === 'Meccan' ? 'makkah' : 'madinah',
      revelationOrder: s.number,
      bismillahPre: s.number !== 1,
      translatedName: s.englishName,
    }));
  }

  async getChapterDetails(chapterId: number): Promise<QuranChapterDetail> {
    const found = QURAN_SURAS.find((s) => s.number === chapterId);
    if (!found) throw new Error('Chapter not found in local data');
    return {
      id: found.number,
      nameSimple: found.englishName,
      nameComplex: found.englishName,
      nameArabic: found.name,
      versesCount: found.verses.length,
      revelationPlace: found.revelationType === 'مكية' || found.revelationType === 'Meccan' ? 'makkah' : 'madinah',
      revelationOrder: found.number,
      bismillahPre: found.number !== 1,
      translatedName: found.englishName,
      pages: [1, 1],
    };
  }

  async getVerses(chapterId: number): Promise<QuranVerse[]> {
    const found = QURAN_SURAS.find((s) => s.number === chapterId);
    if (!found) throw new Error('Chapter not found in local data');
    return found.verses.map((v) => ({
      id: v.number,
      verseNumber: v.number,
      verseKey: `${chapterId}:${v.number}`,
      textUthmani: v.text,
      translationText: 'Translation offline placeholder.',
      audioUrl: `https://everyayah.com/data/Alafasy_128kbps/${String(chapterId).padStart(3, '0')}${String(v.number).padStart(3, '0')}.mp3`,
    }));
  }

  async getTafsir(chapterId: number, verseNumber: number): Promise<TafsirData> {
    return {
      resourceId: 169,
      text: 'التفسير غير متوفر في وضع عدم الاتصال بالشبكة (Offline).',
    };
  }

  async getChapterAudio(chapterId: number): Promise<string> {
    return '';
  }

  async searchQuran(query: string): Promise<QuranSearchResult[]> {
    const queryLower = query.toLowerCase();
    const results: QuranSearchResult[] = [];
    
    for (const s of QURAN_SURAS) {
      for (const v of s.verses) {
        if (v.text.includes(query) || s.name.includes(query) || s.englishName.toLowerCase().includes(queryLower)) {
          results.push({
            verseKey: `${s.number}:${v.number}`,
            textUthmani: v.text,
            translationText: `Sura ${s.englishName}, Verse ${v.number}`,
          });
        }
      }
    }
    return results;
  }
}

// 3. Main Replaceable Service Manager
export class QuranService {
  private provider: IQuranProvider;

  constructor(provider: IQuranProvider = new QuranComProvider()) {
    this.provider = provider;
  }

  setProvider(provider: IQuranProvider) {
    this.provider = provider;
  }

  async getChapters(): Promise<QuranChapter[]> {
    try {
      return await this.provider.getChapters();
    } catch (e) {
      console.warn('Switching to LocalQuranProvider fallback for chapters list');
      const fallback = new LocalQuranProvider();
      return await fallback.getChapters();
    }
  }

  async getChapterDetails(chapterId: number): Promise<QuranChapterDetail> {
    try {
      return await this.provider.getChapterDetails(chapterId);
    } catch (e) {
      console.warn(`Switching to LocalQuranProvider fallback for chapter ${chapterId} details`);
      const fallback = new LocalQuranProvider();
      return await fallback.getChapterDetails(chapterId);
    }
  }

  async getVerses(chapterId: number, translationId?: number): Promise<QuranVerse[]> {
    try {
      return await this.provider.getVerses(chapterId, translationId);
    } catch (e) {
      console.warn(`Switching to LocalQuranProvider fallback for chapter ${chapterId} verses`);
      const fallback = new LocalQuranProvider();
      return await fallback.getVerses(chapterId);
    }
  }

  async getTafsir(chapterId: number, verseNumber: number, tafsirId?: number): Promise<TafsirData> {
    try {
      return await this.provider.getTafsir(chapterId, verseNumber, tafsirId);
    } catch (e) {
      console.warn(`Switching to LocalQuranProvider fallback for tafsir ${chapterId}:${verseNumber}`);
      const fallback = new LocalQuranProvider();
      return await fallback.getTafsir(chapterId, verseNumber);
    }
  }

  async getChapterAudio(chapterId: number, reciterId?: number): Promise<string> {
    try {
      return await this.provider.getChapterAudio(chapterId, reciterId);
    } catch (e) {
      console.warn(`Switching to LocalQuranProvider fallback for chapter audio ${chapterId}`);
      const fallback = new LocalQuranProvider();
      return await fallback.getChapterAudio(chapterId);
    }
  }

  async searchQuran(query: string): Promise<QuranSearchResult[]> {
    try {
      return await this.provider.searchQuran(query);
    } catch (e) {
      console.warn(`Switching to LocalQuranProvider fallback for Quran search`);
      const fallback = new LocalQuranProvider();
      return await fallback.searchQuran(query);
    }
  }
}

export const quranService = new QuranService();
