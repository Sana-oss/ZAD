import React, { useState, useEffect } from 'react';
import { quranService, QuranVerse } from '../services/quranService';
import { QURAN_SURAS } from '../data/quran';
import { JUZ_INFO, TOTAL_PAGES } from '../data/juzMapping';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MushafPageViewProps {
  pageNumber: number;
  onPageChange: (page: number) => void;
}

const MPage: React.FC<MushafPageViewProps> = ({ pageNumber, onPageChange }) => {
  const { settings } = useApp();
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageInput, setPageInput] = useState('');

  const isAr = settings.language === 'ar';
  const isCream = settings.quranTheme === 'cream';

  useEffect(() => {
    let cancelled = false;
    const fetchPage = async () => {
      setLoading(true);
      try {
        const data = await quranService.getPageVerses(pageNumber);
        if (!cancelled) setVerses(data || []);
      } catch {
        if (!cancelled) setVerses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPage();
    return () => { cancelled = true; };
  }, [pageNumber]);

  const getSurahName = (surahNum: number): string =>
    QURAN_SURAS.find(s => s.number === surahNum)?.name || '';

  const getJuzAtVerse = (verseKey: string): number | null => {
    const [s, v] = verseKey.split(':').map(Number);
    for (const j of JUZ_INFO) {
      if (j.startSurah === s && j.startVerse === v) return j.juzNumber;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!loading && verses.length === 0) {
    return (
      <div className="w-full text-center py-20 text-text-secondary arabic-text text-sm font-bold">
        {isAr ? 'لا توجد آيات في هذه الصفحة' : 'No verses found on this page'}
      </div>
    );
  }

  const content: React.ReactNode[] = [];

  const pushJuz = (juzNum: number, key: string) => {
    const j = JUZ_INFO.find(jj => jj.juzNumber === juzNum);
    content.push(
      <div key={key} className="text-center my-6 py-3 border-t border-b border-primary/20">
        <span className="arabic-text text-sm font-bold text-primary">
          {j?.nameAr || `الجزء ${juzNum}`}
        </span>
      </div>
    );
  };

  const pushSurah = (surahNum: number, key: string) => {
    const name = getSurahName(surahNum);
    content.push(
      <div key={key} className="text-center my-8">
        <h3 className="arabic-text text-2xl sm:text-3xl font-black text-primary mb-2">
          سُورَةُ {name || surahNum}
        </h3>
      </div>
    );
    if (surahNum !== 1 && surahNum !== 9) {
      content.push(
        <div key={`basmalah-${key}`} className="text-center my-6 text-2xl sm:text-3xl text-primary/70 font-normal">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      );
    }
  };

  const pushVerse = (v: QuranVerse) => {
    const num = v.verseKey.split(':').map(Number)[1];
    content.push(
      <span key={v.verseKey} className="text-text-primary">
        {v.textUthmani}
        <span className="inline-flex items-center justify-center relative mx-2 select-none align-middle" style={{ top: '-1px' }}>
          <svg className="w-6 h-6 text-amber-600/60 dark:text-amber-500/60 fill-none stroke-current" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth="1" transform="rotate(45 12 12)" />
            <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth="1" />
            <circle cx="12" cy="12" r="4.5" strokeWidth="0.7" className="stroke-amber-600/35" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-sans text-[7.5px] font-bold text-amber-950 dark:text-amber-300">
            {num}
          </span>
        </span>
      </span>
    );
  };

  for (let i = 0; i < verses.length; i++) {
    const v = verses[i];
    const [surahNum, verseNum] = v.verseKey.split(':').map(Number);
    const juzStart = getJuzAtVerse(v.verseKey);
    if (juzStart !== null) pushJuz(juzStart, `juz-${juzStart}-at-${v.verseKey}`);
    if (verseNum === 1) pushSurah(surahNum, `surah-${surahNum}-at-${v.verseKey}`);
    pushVerse(v);
  }

  const goPage = (p: number) => {
    const clamped = Math.min(TOTAL_PAGES, Math.max(1, p));
    if (clamped !== pageNumber) onPageChange(clamped);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4" id="mushaf-page-view">
      <div
        className={`w-full max-w-[800px] mx-auto rounded-3xl border p-6 sm:p-10 shadow-sm transition-all duration-300 ${
          isCream
            ? 'bg-[#FAF6EC] border-[#E8DFC9]'
            : 'bg-white dark:bg-surface border-border-custom'
        }`}
        id="mushaf-page-paper"
      >
        <div className="text-center mb-8 pb-4 border-b border-border-custom/30">
          <h2 className="arabic-text text-xl font-black text-primary">
            {isAr ? 'الصفحة' : 'Page'} {pageNumber}
          </h2>
        </div>

        <div
          className="text-right quran-text select-text leading-[2.8] sm:leading-[3]"
          dir="rtl"
          lang="ar"
          id="mushaf-page-content"
        >
          {content}
        </div>

        <div className="text-center mt-8 pt-4 border-t border-border-custom/30">
          <p className="text-xs font-mono font-bold text-text-secondary">
            {isAr ? `صفحة ${pageNumber}` : `Page ${pageNumber}`} — {TOTAL_PAGES}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[400px] flex flex-col gap-3" id="mushaf-page-nav">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={TOTAL_PAGES}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const p = parseInt(pageInput, 10);
                if (p >= 1 && p <= TOTAL_PAGES) goPage(p);
              }
            }}
            placeholder={isAr ? `رقم الصفحة (1-${TOTAL_PAGES})` : `Page (1-${TOTAL_PAGES})`}
            className="arabic-text text-xs flex-1 rounded-full border border-border-custom bg-surface py-2.5 px-4 focus:outline-none focus:border-primary transition-colors text-center font-bold"
            id="mushaf-page-input"
          />
          <button
            onClick={() => {
              const p = parseInt(pageInput, 10);
              if (p >= 1 && p <= TOTAL_PAGES) goPage(p);
            }}
            className="rounded-full bg-primary text-white px-5 py-2.5 text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
          >
            {isAr ? 'اذهب' : 'Go'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => goPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="flex items-center gap-1 rounded-full bg-surface border border-border-custom px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            {isAr ? 'السابقة' : 'Previous'}
          </button>
          <span className="text-[10px] font-mono font-bold text-text-secondary">
            {pageNumber} / {TOTAL_PAGES}
          </span>
          <button
            onClick={() => goPage(pageNumber + 1)}
            disabled={pageNumber >= TOTAL_PAGES}
            className="flex items-center gap-1 rounded-full bg-surface border border-border-custom px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAr ? 'التالية' : 'Next'}
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MPage;
