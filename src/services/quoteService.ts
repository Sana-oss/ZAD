/**
 * Quote Service
 *
 * Fetches quotes from free external APIs (verified alive + CORS-enabled),
 * backed by a rolling localStorage cache, share-count tracking, and a large
 * curated authentic-hadith dataset for offline scenarios.
 *
 * Live source chain (2026-08 verified):
 *   1. Stoic Quotes  — https://stoic-quotes.com/api/quote        (CORS: *)
 *   2. DummyJSON     — https://dummyjson.com/quotes/random       (CORS: origin echo)
 *   3. Adviceslip    — https://api.adviceslip.com/advice         (CORS: *)
 *   4. Local pool (hydrated in bulk from dummyjson /quotes, up to 200 kept)
 *   5. Curated hadith fallback (this feature intentionally excludes Quran text)
 *
 * NOTE: api.quotable.io is DEAD (DNS no longer resolves) and was removed.
 * zenquotes.io / affirmations.dev work but send no CORS headers, so they are
 * unusable from the browser and were skipped.
 */

export interface Quote {
  id: string;
  text: string;
  textAr?: string;
  author?: string;
  source?: string;
  category?: string;
}

export interface ShareStat {
  quote: Quote;
  count: number;
}

/** Classifies a quote by scripture status so ornamentation stays appropriate. */
export type ScriptureType = 'quran' | 'hadith' | null;

const HADITH_SOURCE_RE =
  /(bukhari|muslim|tirmidhi|abu dawud|ibn majah|nasa'?i|musnad|muwatta|ahmad)/i;

export function getScriptureType(quote: Quote): ScriptureType {
  const src = quote.source || '';
  // Keyed on the citation only — an "Allah" author alone must not imply
  // Quran, otherwise hadith qudsi would be misclassified.
  if (/^surah|quran/i.test(src)) return 'quran';
  if (HADITH_SOURCE_RE.test(src)) return 'hadith';
  return null;
}

const CACHE_KEY = 'islamic_quotes_cache';
const FAVORITES_KEY = 'favorite_quotes';
const SHARE_STATS_KEY = 'zad_quote_share_stats';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT = 8000;

interface CachePayload {
  pool: Quote[];
  fetchedAt: number;
  hydratedAt?: number;
  lastQuoteId?: string;
}

const MAX_POOL = 1700;

/**
 * Faith-sensitivity filter — this feature must not carry content belonging
 * to religions other than Islam. Authors listed are religious authorities/
 * figures of other traditions; terms are unambiguous markers of other
 * scriptures/practices appearing inside quote text.
 */
const EXCLUDED_FAITH_AUTHORS_RE =
  /(confucius|dalai ?lama|mother teresa|c\.?\s?s\.? lewis|\bmartin luther\b(?! king)|francis chan|john stott|ruth graham|billy graham|franklin graham|pope \w+|buddha|bodhidharma|lao[- ]?tzu|guru nanak|ramakrishna|prabhupada|yogananda|thich nhat|shunryu suzuki|rabbi [\w']+)/i;

const EXCLUDED_FAITH_TERMS_RE =
  /\b(buddha|buddhism|buddhist|bodhisattva|dharma|nirvana|karma|reincarnat(?:e|ion)|confucius|confucian|taoism|tao te ching|the tao\b|zen\b|zazen|bible|biblical|gospel|jesus|christ\b|christian(?:ity)?|catholic(?:ism)?|protestant|orthodox church|church(?:es|goer)?|cathedral|chapel|priest(?:hood)?|pastor\b|monk(?:s)?\b|monastic|monastery|nun\b|convent|clergyman|holy spirit|old testament|new testament|psalm(?:s)?\b|torah|talmud|judaism|jewish law|synagogue|shabbat|kosher|vedas?\b|upanishad|bhagavad|gita\b|krishna|vishnu|shiva|hindu(?:ism)?|moksha|samsara|guru granth|gurdwara|zoroastrian|ahura mazda)\b/i;

/**
 * Curated authentic fallback quotes — used when external APIs are unreachable.
 * Hadith only by design: this feature intentionally excludes Quranic text.
 */
export const ISLAMIC_FALLBACK_QUOTES: Quote[] = [
  {
    id: 'islamic_1',
    text: 'Deeds are judged by intentions, and every person will get what they intended.',
    textAr: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari & Muslim',
    category: 'intention',
  },
  {
    id: 'islamic_2',
    text: 'Part of the perfection of a person\u2019s Islam is leaving what does not concern him.',
    textAr: 'مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'character',
  },
  {
    id: 'islamic_3',
    text: 'Make things easy and do not make them difficult; give glad tidings and do not repel people.',
    textAr: 'يَسِّرُوا وَلَا تُعَسِّرُوا، وَبَشِّرُوا وَلَا تُنَفِّرُوا',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'kindness',
  },
  {
    id: 'islamic_4',
    text: 'The most beloved deeds to Allah are the most consistent, even if they are small.',
    textAr: 'أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari & Muslim',
    category: 'consistency',
  },
  {
    id: 'islamic_5',
    text: 'Your smile in the face of your brother is charity.',
    textAr: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'kindness',
  },
  {
    id: 'islamic_6',
    text: 'The strong person is not the good wrestler; rather, the strong person is the one who controls himself when angry.',
    textAr: 'لَيْسَ الشَّدِيدُ بِالصُّرَاكَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِندَ الْغَضَبِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'character',
  },
  {
    id: 'islamic_7',
    text: 'None of you truly believes until he loves for his brother what he loves for himself.',
    textAr: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari & Muslim',
    category: 'brotherhood',
  },
  {
    id: 'islamic_8',
    text: 'Whoever does not thank people has not thanked Allah.',
    textAr: 'لَا يَشْكُرُ اللَّهَ مَن لَّا يَشْكُرُ النَّاسَ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Musnad Ahmad',
    category: 'gratitude',
  },
  {
    id: 'islamic_9',
    text: 'Whoever treads a path in search of knowledge, Allah will make easy for him a path to Paradise.',
    textAr: 'وَمَن سَلَكَ طَرِيقًا يَطْلُبُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'knowledge',
  },
  {
    id: 'islamic_10',
    text: 'Speak a good word or remain silent.',
    textAr: 'فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari & Muslim',
    category: 'speech',
  },
  {
    id: 'islamic_11',
    text: 'A true Muslim is one from whose tongue and hand other people are safe.',
    textAr: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari & Muslim',
    category: 'character',
  },
  {
    id: 'islamic_12',
    text: 'Do not become angry.',
    textAr: 'لَا تَغْضَبْ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'anger',
  },
  {
    id: 'islamic_13',
    text: 'Whoever suppresses anger while able to carry it out, Allah will call him before creation and let him choose any houri he wishes.',
    textAr: 'مَنْ كَظَمَ غَيْظًا وَهُوَ قَادِرٌ عَلَى أَنْ يُنْفِذَهُ دَعَاهُ اللَّهُ عَلَى رُءُوسِ الْخَلَائِقِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'self-control',
  },
  {
    id: 'islamic_14',
    text: 'The merciful will be shown mercy by the Most Merciful. Be merciful to those on earth, and the One above the heavens will be merciful to you.',
    textAr: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الْأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'mercy',
  },
  {
    id: 'islamic_15',
    text: 'The best of you are the best to their families.',
    textAr: 'خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'family',
  },
  {
    id: 'islamic_16',
    text: 'Whoever relieves a believer\u2019s distress in this world, Allah will relieve his distress on the Day of Resurrection.',
    textAr: 'مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'compassion',
  },
  {
    id: 'islamic_17',
    text: 'Whoever makes things easy for someone in hardship, Allah will make things easy for him in this world and the Hereafter.',
    textAr: 'وَمَنْ يَسَّرَ عَلَى مُعْسِرٍ يَسَّرَ اللَّهُ عَلَيْهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'kindness',
  },
  {
    id: 'islamic_18',
    text: 'Whoever calls others to guidance will have a reward like the rewards of all who follow him.',
    textAr: 'مَنْ دَلَّ عَلَى هُدًى فَلَهُ مِثْلُ أُجُورِ مَنْ تَبِعَهُ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'guidance',
  },
  {
    id: 'islamic_19',
    text: 'Gratitude fills the scale.',
    textAr: 'الْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'gratitude',
  },
  {
    id: 'islamic_20',
    text: 'Be mindful of Allah wherever you are; follow a wrong with a good deed that erases it; and treat people with beautiful character.',
    textAr: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'mindfulness',
  },
  {
    id: 'islamic_21',
    text: 'No one who has an atom\u2019s weight of arrogance in his heart will enter Paradise.',
    textAr: 'لَا يَدْخُلُ الْجَنَّةَ مَنْ كَانَ فِي قَلْبِهِ مِثْقَالُ ذَرَّةٍ مِنْ كِبْرٍ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'humility',
  },
  {
    id: 'islamic_22',
    text: 'Allah is Beautiful and He loves beauty.',
    textAr: 'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'beauty',
  },
  {
    id: 'islamic_23',
    text: 'The wise one is he who holds himself accountable and works for what comes after death.',
    textAr: 'الْكَيِّسُ مَنْ دَانَ نَفْسَهُ وَعَمِلَ لِمَا بَعْدَ الْمَوْتِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'wisdom',
  },
  {
    id: 'islamic_24',
    text: 'Two blessings many people squander: health and free time.',
    textAr: 'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ: الصِّحَّةُ وَالْفَرَاغُ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'time',
  },
  {
    id: 'islamic_25',
    text: 'The strong believer is better and more beloved to Allah than the weak believer, though there is good in both.',
    textAr: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'strength',
  },
  {
    id: 'islamic_26',
    text: 'Keep your tongue moist with the remembrance of Allah.',
    textAr: 'لَا يَزَالُ لِسَانُكَ رَطْبًا بِذِكْرِ اللَّهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'remembrance',
  },
  {
    id: 'islamic_27',
    text: 'The one who remembers his Lord and the one who does not are like the living and the dead.',
    textAr: 'مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لَا يَذْكُرُهُ مَثَلُ الْحَيِّ وَالْمَيِّتِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'remembrance',
  },
  {
    id: 'islamic_28',
    text: 'If you relied upon Allah as He deserves, He would provide for you as He provides for the birds.',
    textAr: 'لَوْ أَنَّكُمْ تَوَكَّلْتُمْ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'trust',
  },
  {
    id: 'islamic_29',
    text: 'Charity never decreases wealth.',
    textAr: 'الصَّدَقَةُ لَا تَنْقُصُ مَالًا',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'generosity',
  },
  {
    id: 'islamic_30',
    text: 'A Muslim is the brother of another Muslim: he neither oppresses him nor abandons him.',
    textAr: 'الْمُسْلِمُ أَخُو الْمُسْلِمِ، لَا يَظْلِمُهُ وَلَا يَخْذُلُهُ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'brotherhood',
  },
  {
    id: 'islamic_31',
    text: 'Allah is Gentle and loves gentleness in all matters.',
    textAr: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الْأَمْرِ كُلِّهِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'gentleness',
  },
  {
    id: 'islamic_32',
    text: 'By Allah, I seek Allah\u2019s forgiveness and turn to Him in repentance more than seventy times a day.',
    textAr: 'وَاللَّهِ إِنِّي لَأَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ فِي الْيَوْمِ أَكْثَرَ مِنْ سَبْعِينَ مَرَّةً',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'repentance',
  },
  {
    id: 'islamic_33',
    text: 'Two words light on the tongue, heavy on the scale: \u201CSubhanAllahi wa bihamdih, SubhanAllahil-\u2018Azeem.\u201D',
    textAr: 'كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari & Muslim',
    category: 'remembrance',
  },
  {
    id: 'islamic_34',
    text: 'Whoever says \u201CSubhanAllahi wa bihamdih\u201D one hundred times, his sins fall away even if they were like the foam of the sea.',
    textAr: 'مَنْ قَالَ سُبْحَانَ اللَّهِ وَبِحَمْدِهِ مِائَةَ مَرَّةٍ حُطَّتْ خَطَايَاهُ وَلَوْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'remembrance',
  },
  {
    id: 'islamic_35',
    text: 'The Lord\u2019s pleasure lies in the parent\u2019s pleasure.',
    textAr: 'رِضَا الرَّبِّ فِي رِضَا الْوَالِدِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'parents',
  },
  {
    id: 'islamic_36',
    text: 'Whoever wishes to have his provision expanded and his life extended, let him uphold ties of kinship.',
    textAr: 'مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih al-Bukhari',
    category: 'family',
  },
  {
    id: 'islamic_37',
    text: 'Amazing is the affair of the believer: all of it is good for him.',
    textAr: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'optimism',
  },
  {
    id: 'islamic_38',
    text: 'Be mindful of Allah, and He will protect you.',
    textAr: 'احْفَظِ اللَّهَ يَحْفَظْكَ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Jami at-Tirmidhi',
    category: 'protection',
  },
  {
    id: 'islamic_39',
    text: 'The world is a prison for the believer and a paradise for the disbeliever.',
    textAr: 'الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ',
    author: 'Prophet Muhammad ﷺ',
    source: 'Sahih Muslim',
    category: 'reflection',
  },
  {
    id: 'islamic_40',
    text: 'Allah loves that when one of you does a work, he does it with excellence.',
    textAr: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ',
    author: 'Prophet Muhammad ﷺ',
    source: 'al-Bayhaqi (Sahih)',
    category: 'excellence',
  },
];

class QuoteService {
  private static cache: CachePayload | null = null;

  private static loadCache(): CachePayload {
    if (QuoteService.cache) return QuoteService.cache;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CachePayload;
        if (Date.now() - parsed.fetchedAt < CACHE_DURATION) {
          QuoteService.cache = parsed;
          return parsed;
        }
      }
    } catch {
      // corrupted cache — reset below
    }
    QuoteService.cache = { pool: [], fetchedAt: Date.now() };
    return QuoteService.cache;
  }

  private static saveCache(): void {
    if (!QuoteService.cache) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(QuoteService.cache));
    } catch {
      // storage full / unavailable: fail silently
    }
  }

  private static rememberQuote(quote: Quote): void {
    if (!QuoteService.isFaithAppropriate(quote)) return;
    const cache = QuoteService.loadCache();
    if (!cache.pool.some((q) => q.id === quote.id)) {
      cache.pool.push(quote);
      if (cache.pool.length > MAX_POOL) cache.pool.shift();
    }
    cache.lastQuoteId = quote.id;
    QuoteService.saveCache();
  }

  private static fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    return fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );
  }

  /** True when a quote carries no other-faith religious content. */
  private static isFaithAppropriate(q: Quote): boolean {
    return (
      !EXCLUDED_FAITH_AUTHORS_RE.test(q.author ?? '') &&
      !EXCLUDED_FAITH_TERMS_RE.test(`${q.author ?? ''} ${q.text}`)
    );
  }

  /**
   * Strips internal/API branding (e.g. "DummyJSON") before a quote reaches
   * the UI — covers both freshly fetched and legacy cached entries.
   */
  private static presentable(q: Quote): Quote {
    const INTERNAL_SOURCES = new Set(['DummyJSON']);
    return q.source && INTERNAL_SOURCES.has(q.source)
      ? { ...q, source: undefined }
      : q;
  }

  /**
   * Fetch a random quote from the live source chain, degrading gracefully:
   * Stoic Quotes → DummyJSON → Adviceslip → local pool → curated hadith.
   */
  static async getRandomQuote(): Promise<Quote> {
    const stoic = await this.fetchFromStoicQuotes();
    if (stoic) {
      this.rememberQuote(stoic);
      return this.presentable(stoic);
    }

    const dummy = await this.fetchFromDummyJson();
    if (dummy) {
      this.rememberQuote(dummy);
      return this.presentable(dummy);
    }

    const adviceslip = await this.fetchFromAdviceslip();
    if (adviceslip) {
      this.rememberQuote(adviceslip);
      return this.presentable(adviceslip);
    }

    // Offline / all APIs failed: serve from local pool without repeating,
    // then fall back to the curated dataset. Quranic and other-faith
    // content are excluded by design from this feature.
    const cache = this.loadCache();
    const pool = cache.pool.filter(
      (q) =>
        q.id !== cache.lastQuoteId &&
        getScriptureType(q) !== 'quran' &&
        this.isFaithAppropriate(q)
    );
    if (pool.length > 0) {
      return this.presentable(pool[Math.floor(Math.random() * pool.length)]);
    }
    return this.getFallbackQuote();
  }

  /**
   * Stoic Quotes API — free, no key, CORS enabled.
   * https://stoic-quotes.com/
   */
  static async fetchFromStoicQuotes(): Promise<Quote | null> {
    try {
      const response = await this.fetchWithTimeout(
        'https://stoic-quotes.com/api/quote'
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.text) return null;
      return {
        id: `sq_${this.hashCode(data.text)}`,
        text: data.text,
        author: data.author || 'A Stoic philosopher',
        source: 'Stoic Quotes',
        category: 'wisdom',
      };
    } catch (error) {
      console.error('Stoic Quotes API error:', error);
      return null;
    }
  }

  /**
   * DummyJSON Quotes API — free, no key, CORS enabled.
   * https://dummyjson.com/docs/quotes
   */
  static async fetchFromDummyJson(): Promise<Quote | null> {
    try {
      const response = await this.fetchWithTimeout(
        'https://dummyjson.com/quotes/random'
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.quote) return null;
      return {
        id: `dj_${data.id}`,
        text: data.quote,
        author: data.author,
        category: 'wisdom',
      };
    } catch (error) {
      console.error('DummyJSON API error:', error);
      return null;
    }
  }

  /**
   * One-shot bulk hydration of the local pool from DummyJSON's full list
   * (~145 quotes incl. Rumi & co). Runs at most once per 24h; afterwards the
   * pool serves browse/search offline with zero network calls.
   */
  static async refreshRemotePool(): Promise<void> {
    const now = Date.now();
    const cache = this.loadCache();
    if (cache.hydratedAt && now - cache.hydratedAt < CACHE_DURATION) return;

    try {
      const response = await this.fetchWithTimeout(
        'https://dummyjson.com/quotes?limit=1500'
      );
      if (!response.ok) return;
      const data = await response.json();

      for (const q of data.quotes ?? []) {
        if (!q?.quote) continue;
        const mapped: Quote = {
          id: `dj_${q.id}`,
          text: q.quote,
          author: q.author,
          category: 'wisdom',
        };
        // Faith filter + dedupe at ingestion.
        if (
          !this.isFaithAppropriate(mapped) ||
          cache.pool.some((p) => p.id === mapped.id)
        ) {
          continue;
        }
        cache.pool.push(mapped);
      }
      while (cache.pool.length > MAX_POOL) cache.pool.shift();

      cache.hydratedAt = now;
      this.saveCache();
    } catch (error) {
      console.error('Remote pool hydration failed:', error);
    }
  }

  /**
   * Adviceslip API — simple fallback, no auth.
   * https://api.adviceslip.com/
   */
  static async fetchFromAdviceslip(): Promise<Quote | null> {
    try {
      // Cache-buster so the endpoint returns varied advice per call.
      const response = await fetch(
        `https://api.adviceslip.com/advice?random=${Date.now()}`
      );
      const data = await response.json();
      const advice: string = data.slip?.advice || data.slip;
      if (!advice) throw new Error('Empty adviceslip response');

      return {
        id: data.slip_id ? String(data.slip_id) : `as_${this.hashCode(advice)}`,
        text: advice,
        source: 'Adviceslip',
        category: 'inspirational',
      };
    } catch (error) {
      console.error('Adviceslip API error:', error);
      return null;
    }
  }

  /**
   * Search across the full local corpus (curated hadith + hydrated remote
   * pool). The pool is bulk-hydrated from DummyJSON once per 24h, so after
   * the first call this is instant and works offline.
   */
  static async searchQuotes(query: string): Promise<Quote[]> {
    await this.refreshRemotePool();

    const lower = query.toLowerCase();
    const seen = new Set<string>();
    const results: Quote[] = [];

    for (const q of [...ISLAMIC_FALLBACK_QUOTES, ...this.loadCache().pool]) {
      if (
        seen.has(q.id) ||
        getScriptureType(q) === 'quran' ||
        !this.isFaithAppropriate(q) ||
        !(q.text.toLowerCase().includes(lower) ||
          (q.textAr || '').includes(query) ||
          (q.author || '').toLowerCase().includes(lower))
      ) {
        continue;
      }
      seen.add(q.id);
      results.push(this.presentable(q));
    }

    return results.slice(0, 12);
  }

  /** Deduped local pool (curated + cached), Quran & other-faith content excluded. */
  static getAllLocalQuotes(): Quote[] {
    const seen = new Set<string>();
    const out: Quote[] = [];
    for (const q of [...ISLAMIC_FALLBACK_QUOTES, ...this.loadCache().pool]) {
      if (
        seen.has(q.id) ||
        getScriptureType(q) === 'quran' ||
        !this.isFaithAppropriate(q)
      ) {
        continue;
      }
      seen.add(q.id);
      out.push(this.presentable(q));
    }
    return out;
  }

  /**
   * Get quotes by category from the local corpus.
   */
  static async getQuotesByCategory(category: string): Promise<Quote[]> {
    await this.refreshRemotePool();
    const cat = category.toLowerCase();
    return this.getAllLocalQuotes().filter(
      (q) => (q.category || '').toLowerCase() === cat
    );
  }

  /** Curated fallback for when APIs fail and the pool is empty (rotates daily). */
  static getFallbackQuote(): Quote {
    const dayIndex =
      Math.floor(Date.now() / CACHE_DURATION) % ISLAMIC_FALLBACK_QUOTES.length;
    return ISLAMIC_FALLBACK_QUOTES[dayIndex];
  }

  // ---------- Favorites ----------

  static getFavorites(): string[] {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  }

  static setFavorites(ids: string[]): void {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  }

  // ---------- Share tracking ----------

  static getShareStats(): ShareStat[] {
    try {
      const raw = localStorage.getItem(SHARE_STATS_KEY);
      if (!raw) return [];
      const stats = Object.values(JSON.parse(raw) as Record<string, ShareStat>);
      return stats
        .filter(
          (s) =>
            getScriptureType(s.quote) !== 'quran' &&
            QuoteService.isFaithAppropriate(s.quote)
        )
        .sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  }

  static trackShare(quote: Quote): void {
    try {
      const raw = localStorage.getItem(SHARE_STATS_KEY);
      const stats = raw ? (JSON.parse(raw) as Record<string, ShareStat>) : {};
      const existing = stats[quote.id];
      stats[quote.id] = {
        quote,
        count: (existing?.count || 0) + 1,
      };
      localStorage.setItem(SHARE_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }

  private static hashCode(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}

// All members are static; expose the class itself under the conventional
// lowercase alias so call sites read `quoteService.getRandomQuote()`.
export const quoteService = QuoteService;

export type { QuoteService };
