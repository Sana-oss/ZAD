import { Hadith, HadithGrade } from '../types';
import { hadiths } from '../data/hadiths';
import { enrichHadiths } from '../data/hadithEnrichment';

export interface HadithFilterOptions {
  query?: string;
  book?: string;
  narrator?: string;
  grade?: HadithGrade | '';
  tag?: string;
  sortBy?: 'newest' | 'oldest' | 'authenticity';
}

export class HadithService {
  private static instance: HadithService;
  private hadiths: Hadith[];

  private constructor() {
    this.hadiths = enrichHadiths(hadiths);
  }

  public static getInstance(): HadithService {
    if (!HadithService.instance) {
      HadithService.instance = new HadithService();
    }
    return HadithService.instance;
  }

  public getHadiths(): Hadith[] {
    return this.hadiths;
  }

  public getBooks(): string[] {
    const books = new Set(this.hadiths.map(h => h.book));
    return Array.from(books);
  }

  public getNarrators(): string[] {
    const narrators = new Set(this.hadiths.map(h => h.narrator));
    return Array.from(narrators);
  }

  public getTags(): string[] {
    const tags = new Set(this.hadiths.flatMap(h => h.tags));
    return Array.from(tags);
  }

  public searchAndFilter(options: HadithFilterOptions): Hadith[] {
    let result = this.hadiths;

    if (options.query) {
      const q = options.query.toLowerCase();
      result = result.filter(h => 
        h.textEn.toLowerCase().includes(q) || 
        h.textAr.includes(q) ||
        h.narrator.toLowerCase().includes(q) ||
        h.book.toLowerCase().includes(q)
      );
    }

    if (options.book) {
      result = result.filter(h => h.book === options.book);
    }

    if (options.narrator) {
      result = result.filter(h => h.narrator === options.narrator);
    }

    if (options.grade) {
      result = result.filter(h => h.grade === options.grade);
    }

    if (options.tag) {
      result = result.filter(h => h.tags.includes(options.tag!));
    }

    if (options.sortBy) {
      result = [...result]; // Clone before sorting
      if (options.sortBy === 'authenticity') {
        const gradeOrder = { 'Sahih': 1, 'Hasan': 2, 'Daif': 3, 'Unknown': 4 };
        result.sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]);
      } else if (options.sortBy === 'newest') {
        // Mock sorting by newest (reverse id)
        result.reverse();
      }
      // 'oldest' is default order for mock data
    }

    return result;
  }

  public getHadithOfTheDay(): Hadith {
    // Generate a consistent pseudo-random index based on the current date
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % this.hadiths.length;
    return this.hadiths[index];
  }
}

export const hadithService = HadithService.getInstance();
