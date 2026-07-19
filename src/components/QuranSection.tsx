import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  BookMarked, 
  ZoomIn, 
  ZoomOut, 
  BookOpen, 
  Volume2, 
  BookText, 
  Globe, 
  ChevronRight,
  AlignJustify
} from 'lucide-react';
import { quranService, QuranChapter, QuranVerse, TafsirData, QuranSearchResult } from '../services/quranService';

const VerseMarker: React.FC<{ number: number }> = ({ number }) => {
  return (
    <span className="inline-flex items-center justify-center relative mx-2 select-none align-middle" style={{ top: '-1px' }} id={`verse-marker-${number}`}>
      <svg className="w-6 h-6 text-amber-600/60 dark:text-amber-500/60 fill-none stroke-current" viewBox="0 0 24 24">
        {/* Rotated square */}
        <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth="1" transform="rotate(45 12 12)" />
        {/* Standing square */}
        <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth="1" />
        {/* Inner thin circle */}
        <circle cx="12" cy="12" r="4.5" strokeWidth="0.7" className="stroke-amber-600/35" />
      </svg>
      {/* Number centered */}
      <span className="absolute inset-0 flex items-center justify-center font-sans text-[7.5px] font-bold text-amber-950 dark:text-amber-300">
        {number}
      </span>
    </span>
  );
};

export const QuranSection: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    quranSearchQuery, 
    setQuranSearchQuery,
    setPlayingAudio,
    audioPlaying,
    setAudioPlaying,
    playingAudio
  } = useApp();

  const [chapters, setChapters] = useState<QuranChapter[]>([]);
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(1);
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hover, active and copied state for individual verses (for continuous flow and popup actions)
  const [hoveredVerseNumber, setHoveredVerseNumber] = useState<number | null>(null);
  const [activeVerseNumber, setActiveVerseNumber] = useState<number | null>(null);
  const [copiedVerseNumber, setCopiedVerseNumber] = useState<number | null>(null);

  // Quran.com Display Settings
  const [showTranslation, setShowTranslation] = useState(false);
  const [readingMode, setReadingMode] = useState<'verse' | 'continuous'>('continuous');
  const [quranTheme, setQuranTheme] = useState<'white' | 'cream'>('white');
  const [fontSizePercent, setFontSizePercent] = useState<number>(100);
  const [isSavedProgress, setIsSavedProgress] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Set sidebar closed on mobile/tablet initially for optimized initial reading experience
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  }, []);

  // Track Reading Progress (Scroll)
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height <= 0) {
        setScrollProgress(0);
      } else {
        const scrolled = (winScroll / height) * 100;
        setScrollProgress(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call to set progress
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [verses, quranTheme, fontSizePercent, showTranslation, readingMode]);

  // Active Tafsir State
  const [activeTafsirVerse, setActiveTafsirVerse] = useState<QuranVerse | null>(null);
  const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  // Search mode: 'index' for surah name search, 'global' for live phrase search in Quran
  const [searchMode, setSearchMode] = useState<'index' | 'global'>('index');
  const [globalResults, setGlobalResults] = useState<QuranSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const isAr = settings.language === 'ar';

  // 1. Fetch Chapters list on Mount
  useEffect(() => {
    const fetchChapters = async () => {
      setLoadingChapters(true);
      try {
        const data = await quranService.getChapters();
        setChapters(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load Quran chapters', err);
        setError(isAr ? 'تعذر تحميل فهرس السور. الرجاء التحقق من الاتصال بالشبكة.' : 'Failed to load chapters list. Please check your connection.');
      } finally {
        setLoadingChapters(false);
      }
    };
    fetchChapters();
  }, [isAr]);

  // 2. Fetch Verses whenever selectedSurahNum changes
  useEffect(() => {
    const fetchVerses = async () => {
      setLoadingVerses(true);
      setActiveTafsirVerse(null); // Reset active Tafsir on Surah switch
      setTafsirData(null);
      try {
        const data = await quranService.getVerses(selectedSurahNum);
        setVerses(data);
      } catch (err) {
        console.error(`Failed to load verses for surah ${selectedSurahNum}`, err);
      } finally {
        setLoadingVerses(false);
      }
    };
    fetchVerses();
  }, [selectedSurahNum]);

  // 3. Trigger global text search
  const handleGlobalSearch = async () => {
    if (!quranSearchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      const results = await quranService.searchQuran(quranSearchQuery);
      setGlobalResults(results);
    } catch (err) {
      console.error('Global search failed', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  // 4. Save Reading Progress to User Settings
  const handleSaveProgress = (verseNumber = 1) => {
    setIsSavedProgress(true);
    updateSettings({
      quranProgress: {
        surahNumber: selectedSurahNum,
        verseNumber,
        progressPercentage: Math.round((verseNumber / (selectedSurah?.versesCount || 1)) * 100),
      }
    });
    setTimeout(() => setIsSavedProgress(false), 2000);
  };

  // 5. Fetch Tafsir for a specific verse
  const handleViewTafsir = async (verse: QuranVerse) => {
    setActiveTafsirVerse(verse);
    setLoadingTafsir(true);
    setTafsirData(null);
    try {
      const tafsirId = isAr ? 14 : 169; // 14 for Arabic Ibn Kathir, 169 for English Ibn Kathir
      const data = await quranService.getTafsir(selectedSurahNum, verse.verseNumber, tafsirId);
      setTafsirData(data);
    } catch (err) {
      console.error('Tafsir loading failed', err);
    } finally {
      setLoadingTafsir(false);
    }
  };

  // 6. Play individual verse audio
  const handlePlayVerse = (verse: QuranVerse) => {
    const isPlayingCurrent = playingAudio && playingAudio.id === `quran_v_${selectedSurahNum}_${verse.verseNumber}`;
    if (isPlayingCurrent) {
      setAudioPlaying(!audioPlaying);
    } else {
      setPlayingAudio({
        id: `quran_v_${selectedSurahNum}_${verse.verseNumber}`,
        text: verse.textUthmani,
        title: `${isAr ? 'سورة' : 'Sura'} ${selectedSurah?.nameArabic || selectedSurah?.nameSimple} - ${isAr ? 'آية' : 'Ayah'} ${verse.verseNumber}`,
        category: 'quran',
        audioUrl: verse.audioUrl,
        isQuran: true
      });
    }
  };

  // 7. Copy verse text with elegant feedback
  const handleCopyVerse = async (verse: QuranVerse) => {
    try {
      await navigator.clipboard.writeText(verse.textUthmani);
      setCopiedVerseNumber(verse.verseNumber);
      setTimeout(() => setCopiedVerseNumber(null), 1500);
    } catch (err) {
      console.error('Failed to copy verse text', err);
    }
  };

  // Helpers
  const selectedSurah = chapters.find((c) => c.id === selectedSurahNum);

  const filteredChapters = chapters.filter((c) => {
    if (searchMode === 'global' || !quranSearchQuery) return true;
    const q = quranSearchQuery.toLowerCase();
    return c.nameArabic.includes(q) || c.nameSimple.toLowerCase().includes(q) || String(c.id) === q;
  });

  const getFontSizeClass = () => {
    if (fontSizePercent <= 80) return 'text-md';
    if (fontSizePercent <= 100) return 'text-lg';
    if (fontSizePercent <= 120) return 'text-xl';
    if (fontSizePercent <= 140) return 'text-2xl';
    return 'text-3xl';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="quran-root">
      
      {/* Reading Progress Track (Fixed at top) */}
      <div 
        className="fixed top-0 left-0 w-full h-1.5 bg-primary/10 z-[100] pointer-events-none"
        id="quran-reading-progress-track"
      >
        <div 
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
          id="quran-reading-progress-bar"
        />
      </div>

      {/* Dynamic Immersive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto w-full" id="quran-layout-grid">
        
        {/* Left Mushaf Content Area */}
        <div className={`flex flex-col gap-5 order-2 lg:order-1 w-full transition-all duration-300 ${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`} id="quran-reading-pane">
          
          {/* Header toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl border border-border-custom bg-surface shadow-sm" id="reading-toolbar">
            
            {/* Action Buttons Block */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto" id="toolbar-actions-block">
              {/* Sidebar Index/Search Toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`flex items-center justify-center gap-1.5 rounded-full text-xs font-bold px-4 py-2 border cursor-pointer transition-all active-press ${
                  showSidebar 
                    ? 'bg-primary/15 border-primary/30 text-primary' 
                    : 'bg-primary text-white border-primary hover:bg-primary-hover shadow-sm'
                }`}
                id="btn-toggle-sidebar"
                title={isAr ? 'عرض/إخفاء الفهرس والبحث' : 'Show/Hide Index and Search'}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="arabic-text">{isAr ? 'الفهرس والبحث' : 'Sura Index & Search'}</span>
              </button>

              {/* Save Progress */}
              <button
                onClick={() => handleSaveProgress(1)}
                className="flex items-center justify-center gap-2 rounded-full bg-primary/5 text-primary border border-primary/10 text-xs font-bold px-4 py-2 hover:bg-primary/10 active-press transition-colors cursor-pointer"
                id="btn-save-progress"
              >
                <BookMarked className="h-3.5 w-3.5" />
                <span className="arabic-text">{isSavedProgress ? 'تم حفظ التقدم!' : 'حفظ موضع القراءة'}</span>
              </button>

              {/* Translation Toggle - only in verse mode */}
              {readingMode === 'verse' && (
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`flex items-center justify-center gap-1.5 rounded-full text-xs font-bold px-4 py-2 border cursor-pointer transition-all active-press ${
                    showTranslation 
                      ? 'bg-primary/5 border-primary/20 text-primary' 
                      : 'bg-surface border-border-custom text-text-secondary hover:text-text-primary'
                  }`}
                  id="btn-toggle-translation"
                  title={isAr ? 'إظهار الترجمة الإنجليزية' : 'Show English Translation'}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="arabic-text">{isAr ? 'الترجمة' : 'Translation'}</span>
                </button>
              )}
            </div>

            {/* Reading Mode Toggle */}
            <div className="flex rounded-full border border-border-custom p-0.5 bg-surface-muted mx-1" id="reading-mode-toggle">
              <button
                onClick={() => setReadingMode('continuous')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold arabic-text transition-all cursor-pointer ${
                  readingMode === 'continuous' 
                    ? 'bg-surface text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                id="btn-mode-continuous"
                title={isAr ? 'قراءة متصلة' : 'Continuous Reading'}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{isAr ? 'قراءة' : 'Reading'}</span>
              </button>
              <button
                onClick={() => setReadingMode('verse')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold arabic-text transition-all cursor-pointer ${
                  readingMode === 'verse' 
                    ? 'bg-surface text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                id="btn-mode-verse"
                title={isAr ? 'قراءة آية بآية' : 'Verse by Verse'}
              >
                <AlignJustify className="h-3.5 w-3.5" />
                <span>{isAr ? 'آية آية' : 'Verse by Verse'}</span>
              </button>
            </div>

            {/* Font size adjustments */}
            <div className="flex items-center gap-3 bg-surface-muted/30 px-3 py-1.5 rounded-full border border-border-custom/50" id="font-size-adjuster">
              <button
                onClick={() => setFontSizePercent((prev) => Math.max(80, prev - 20))}
                className="rounded-full p-1 text-text-primary bg-surface hover:bg-surface-muted transition-colors border border-border-custom shadow-sm cursor-pointer"
                title="تصغير الخط"
                id="btn-font-decrease"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              
              <span className="font-sans font-extrabold text-xs text-text-secondary select-none">
                {fontSizePercent}%
              </span>

              <button
                onClick={() => setFontSizePercent((prev) => Math.min(180, prev + 20))}
                className="rounded-full p-1 text-text-primary bg-surface hover:bg-surface-muted transition-colors border border-border-custom shadow-sm cursor-pointer"
                title="تكبير الخط"
                id="btn-font-increase"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reading panel background theme toggle */}
            <div className="flex rounded-full border border-border-custom p-0.5 bg-surface-muted" id="reading-theme-toggle">
              <button
                onClick={() => setQuranTheme('cream')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold arabic-text transition-all cursor-pointer ${
                  quranTheme === 'cream' 
                    ? 'bg-[#FAF6EC] text-[#2B2519] shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                id="btn-theme-cream"
              >
                كريمي
              </button>
              <button
                onClick={() => setQuranTheme('white')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold arabic-text transition-all cursor-pointer ${
                  quranTheme === 'white' 
                    ? 'bg-surface text-text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                id="btn-theme-white"
              >
                أبيض
              </button>
            </div>

          </div>

          {/* Reading panel */}
          <div 
            className={`rounded-3xl border transition-all duration-300 p-6 sm:p-10 shadow-sm flex flex-col items-center relative overflow-visible min-h-[550px] ${
              quranTheme === 'cream' 
                ? 'bg-[#FAF6EC] border-[#E8DFC9] text-[#2B2519]' 
                : 'bg-surface border-border-custom text-text-primary'
            }`}
            id="mushaf-paper"
          >
            {loadingVerses ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-20 rounded-3xl" id="reading-pane-loader">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                <p className="arabic-text text-sm font-bold text-primary mt-4">جاري تحميل الآيات العطرة...</p>
              </div>
            ) : null}

            {/* Top decorative badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 mb-4" id="mushaf-illustration">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>

            {/* Active Surah Title Block */}
            {selectedSurah ? (
              <div className="text-center mb-8" id="mushaf-surah-header">
                <h2 className="arabic-text text-2xl sm:text-3xl font-black text-primary" id="mushaf-surah-title">
                  سُورَةُ {selectedSurah.nameArabic}
                </h2>
                <p className="arabic-text text-xs text-text-secondary mt-1 font-bold">
                  {isAr ? (selectedSurah.revelationPlace === 'makkah' ? 'مكية' : 'مدنية') : selectedSurah.revelationPlace.toUpperCase()} | {selectedSurah.versesCount} {isAr ? 'آيات' : 'Verses'}
                </p>
              </div>
            ) : (
              <div className="text-center mb-8" id="mushaf-surah-header-fallback">
                <h2 className="arabic-text text-2xl sm:text-3xl font-black text-primary">سُورَةُ الفَاتِحَة</h2>
              </div>
            )}

            {/* Surah Bismillah - Special standalone element */}
            {selectedSurahNum !== 1 && selectedSurahNum !== 9 && (
              <div 
                className="text-center quran-text text-3xl sm:text-4xl my-10 text-primary/80 tracking-wide font-normal select-none"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  fontFeatureSettings: '"ccmp" 1, "locl" 1, "rlig" 1, "calt" 1, "mset" 1',
                }}
                id="mushaf-bismillah"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}

            {/* Verses Flow Display - Beautiful Continuous Reading Layout */}
            {readingMode === 'verse' ? (
              /* 1. Translation / Stacked view - single cohesive column without cards */
              <div className="w-full max-w-[950px] mx-auto flex flex-col divide-y divide-border-custom/30" id="mushaf-verses-stacked">
                {verses.map((v) => {
                  const isPlaying = playingAudio && playingAudio.id === `quran_v_${selectedSurahNum}_${v.verseNumber}`;
                  const isSelectedForTafsir = activeTafsirVerse?.verseNumber === v.verseNumber;
                  const isHovered = hoveredVerseNumber === v.verseNumber;
                  const isActive = activeVerseNumber === v.verseNumber;

                  return (
                    <div 
                      key={v.id} 
                      className={`group py-6 px-4 transition-all duration-200 flex flex-col gap-4 relative rounded-2xl ${
                        isSelectedForTafsir 
                          ? 'bg-primary/5' 
                          : isPlaying
                            ? 'bg-primary/5'
                            : isHovered || isActive
                              ? 'bg-surface-muted/30'
                              : 'bg-transparent'
                      }`}
                      id={`verse-row-${v.verseNumber}`}
                      onMouseEnter={() => setHoveredVerseNumber(v.verseNumber)}
                      onMouseLeave={() => setHoveredVerseNumber(null)}
                      onClick={() => setActiveVerseNumber(activeVerseNumber === v.verseNumber ? null : v.verseNumber)}
                    >
                      {/* Verse Text Header (Control row & Arabic text) */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4" id={`verse-top-row-${v.verseNumber}`}>
                        
                        {/* Left: Interactive action buttons for this verse - subtle, lower visual weight */}
                        {/* Fades and slides up 6px (translate-y-1.5 -> 0) on hover or active */}
                        <div 
                          className={`flex items-center gap-1.5 transition-all duration-200 ease-out ${
                            isHovered || isActive || isPlaying || isSelectedForTafsir
                              ? 'opacity-100 translate-y-0 pointer-events-auto' 
                              : 'md:opacity-0 md:translate-y-1.5 md:pointer-events-none'
                          }`}
                          id={`verse-actions-${v.verseNumber}`}
                          onClick={(e) => e.stopPropagation()} // Prevent card toggle on action click
                        >
                          {/* Play Audio Button */}
                          <button
                            onClick={() => handlePlayVerse(v)}
                            className={`p-2 rounded-full border transition-colors cursor-pointer ${
                              isPlaying
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-surface border-border-custom text-text-secondary hover:text-primary hover:bg-primary/5'
                            }`}
                            title={isPlaying && audioPlaying ? 'إيقاف مؤقت' : 'استمع للآية الكريمة'}
                            id={`btn-play-verse-${v.verseNumber}`}
                          >
                            {isPlaying && audioPlaying ? (
                              <span className="flex items-center justify-center h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                              </span>
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Tafsir Details trigger */}
                          <button
                            onClick={() => handleViewTafsir(v)}
                            className={`flex items-center gap-1.5 p-2 px-3 rounded-full border transition-colors cursor-pointer ${
                              isSelectedForTafsir
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-surface border-border-custom text-text-secondary hover:text-primary hover:bg-primary/5'
                            }`}
                            title="تفسير الآية (ابن كثير)"
                            id={`btn-tafsir-${v.verseNumber}`}
                          >
                            <BookText className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold arabic-text">{isAr ? 'التفسير' : 'View Tafsir'}</span>
                          </button>

                          {/* Mark reading progress to this verse */}
                          <button
                            onClick={() => handleSaveProgress(v.verseNumber)}
                            className="p-2 rounded-full border border-border-custom bg-surface text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                            title="حفظ موضع القراءة هنا"
                            id={`btn-save-progress-here-${v.verseNumber}`}
                          >
                            <BookMarked className="h-3.5 w-3.5" />
                          </button>

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopyVerse(v)}
                            className="p-2 rounded-full border border-border-custom bg-surface text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center"
                            title="نسخ الآية"
                            id={`btn-copy-verse-${v.verseNumber}`}
                          >
                            {copiedVerseNumber === v.verseNumber ? (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1">تم!</span>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>

                        </div>

                        {/* Right: Beautiful Arabic text */}
                        <div className="text-right flex-1" id={`verse-text-container-${v.verseNumber}`}>
                          <p 
                            className="quran-text text-right tracking-wide leading-[2.2] text-text-primary"
                            dir="rtl"
                            lang="ar"
                            style={{ 
                              fontSize: `${fontSizePercent * 0.18 + 18}px`,
                            }}
                          >
                            {v.textUthmani}
                            <VerseMarker number={v.verseNumber} />
                          </p>
                        </div>

                      </div>

                      {/* Translation row */}
                      {showTranslation && v.translationText && (
                        <div className="pt-1 text-left animate-fade-in" id={`verse-translation-${v.verseNumber}`}>
                          <p className="text-sm text-text-secondary leading-relaxed font-sans text-left pr-4">
                            {v.translationText}
                          </p>
                        </div>
                      )}

                      {/* Live Tafsir view panel */}
                      {isSelectedForTafsir && (
                        <div className="mt-3 bg-primary/5 rounded-2xl p-5 border border-primary/10 text-right animate-fade-in" id={`verse-tafsir-card-${v.verseNumber}`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-3">
                            <button 
                              onClick={() => setActiveTafsirVerse(null)}
                              className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                            >
                              إغلاق التفسير ×
                            </button>
                            <span className="arabic-text text-xs font-bold text-primary">تفسير ابن كثير</span>
                          </div>
                          {loadingTafsir ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
                            </div>
                          ) : (
                            <div 
                              className="arabic-text text-sm font-semibold text-text-primary leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 text-right"
                              dangerouslySetInnerHTML={{ __html: tafsirData?.text || '' }}
                            />
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              /* 2. Mushaf Mode - continuous flowing prose paragraphs */
              <div className="w-full flex flex-col items-center gap-6" id="mushaf-verses-continuous-container">
                <div 
                  className="w-full max-w-[950px] mx-auto text-right quran-text select-text leading-[2.6] sm:leading-[2.8]"
                  dir="rtl"
                  lang="ar"
                  style={{ 
                    fontSize: `${fontSizePercent * 0.18 + 18}px`,
                    textAlign: 'justify',
                    textJustify: 'inter-word'
                  }}
                  id="mushaf-verses-continuous"
                >
                  {verses.map((v) => {
                    const isPlaying = playingAudio && playingAudio.id === `quran_v_${selectedSurahNum}_${v.verseNumber}`;
                    const isSelectedForTafsir = activeTafsirVerse?.verseNumber === v.verseNumber;
                    const isHovered = hoveredVerseNumber === v.verseNumber;
                    const isActive = activeVerseNumber === v.verseNumber;

                    return (
                      <span 
                        key={v.id}
                        className={`relative inline transition-all duration-200 rounded-xl cursor-pointer px-1.5 py-1 ${
                          isPlaying 
                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm' 
                            : isSelectedForTafsir 
                              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/20 shadow-sm'
                              : isHovered || isActive
                                ? 'bg-primary/5 text-primary ring-1 ring-primary/10 shadow-sm'
                                : 'text-text-primary hover:bg-primary/5 hover:text-primary'
                        }`}
                        onMouseEnter={() => setHoveredVerseNumber(v.verseNumber)}
                        onMouseLeave={() => setHoveredVerseNumber(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVerseNumber(activeVerseNumber === v.verseNumber ? null : v.verseNumber);
                        }}
                        id={`verse-inline-${v.verseNumber}`}
                      >
                        {v.textUthmani}
                        <VerseMarker number={v.verseNumber} />
                        
                        {/* Hover action popup for continuous mode */}
                        <span 
                          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex items-center gap-1.5 bg-surface border border-border-custom px-2 py-1 rounded-full shadow-lg z-30 transition-all duration-150 ease-out pointer-events-auto ${
                            isHovered || isActive
                              ? 'opacity-100 translate-y-0 scale-100'
                              : 'opacity-0 translate-y-1 scale-95 pointer-events-none'
                          }`}
                          onClick={(e) => e.stopPropagation()} // Prevent closing
                          id={`verse-popup-actions-${v.verseNumber}`}
                        >
                          {/* Play Button */}
                          <button
                            onClick={() => handlePlayVerse(v)}
                            className={`p-1.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer ${
                              isPlaying ? 'text-primary' : 'text-text-secondary hover:text-primary'
                            }`}
                            title="تشغيل الصوت"
                          >
                            {isPlaying && audioPlaying ? (
                              <span className="flex items-center justify-center h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                              </span>
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          
                          {/* Tafsir Button */}
                          <button
                            onClick={() => handleViewTafsir(v)}
                            className={`flex items-center gap-1 p-1.5 px-2.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer ${
                              isSelectedForTafsir ? 'text-primary bg-primary/10 font-bold' : 'text-text-secondary hover:text-primary'
                            }`}
                            title="التفسير"
                          >
                            <BookText className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-bold arabic-text hidden sm:inline-block">{isAr ? 'التفسير' : 'Tafsir'}</span>
                          </button>

                          {/* Save Progress Button */}
                          <button
                            onClick={() => handleSaveProgress(v.verseNumber)}
                            className="p-1.5 rounded-full text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="حفظ موضع القراءة"
                          >
                            <BookMarked className="h-3.5 w-3.5" />
                          </button>

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopyVerse(v)}
                            className="p-1.5 rounded-full text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center"
                            title="نسخ الآية"
                          >
                            {copiedVerseNumber === v.verseNumber ? (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 px-1">تم!</span>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* Live Tafsir view panel for continuous mode at the bottom of the prose */}
                {activeTafsirVerse && (
                  <div className="w-full max-w-[800px] mt-8 bg-primary/5 rounded-2xl p-5 border border-primary/10 text-right animate-fade-in" id="continuous-tafsir-card">
                    <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-3">
                      <button 
                        onClick={() => setActiveTafsirVerse(null)}
                        className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        إغلاق التفسير ×
                      </button>
                      <span className="arabic-text text-xs font-bold text-primary">
                        تفسير ابن كثير (الآية {activeTafsirVerse.verseNumber})
                      </span>
                    </div>
                    {loadingTafsir ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
                      </div>
                    ) : (
                      <div 
                        className="arabic-text text-sm font-semibold text-text-primary leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 text-right"
                        dangerouslySetInnerHTML={{ __html: tafsirData?.text || '' }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Sura Pages indicator */}
            <div className="w-full flex items-center justify-between border-t border-border-custom/30 pt-6 mt-12 text-[10px] font-bold text-text-secondary font-mono" id="mushaf-footer">
              <span>PAGE {selectedSurah?.pages?.[0] || 1}</span>
              <span className="arabic-text">{isAr ? 'صدق الله العظيم' : 'Sadaqallahul-Azim'}</span>
              <span>SURAH {selectedSurahNum}</span>
            </div>

          </div>

        </div>

        {/* Mobile Drawer Backdrop */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300 animate-fade-in" 
            onClick={() => setShowSidebar(false)} 
            id="sidebar-backdrop"
          />
        )}

        {/* Right Index & Global Search Sidebar Panel (col-span 4) */}
        <div 
          className={showSidebar
            ? "lg:col-span-4 flex flex-col gap-4 order-1 lg:order-2 bg-surface max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-screen max-lg:w-80 max-lg:max-w-[85vw] max-lg:z-50 max-lg:shadow-2xl max-lg:border-l max-lg:border-border-custom max-lg:p-5 transition-transform duration-300 translate-x-0"
            : "lg:col-span-4 flex flex-col gap-4 order-1 lg:order-2 bg-surface max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-screen max-lg:w-80 max-lg:max-w-[85vw] max-lg:z-50 max-lg:shadow-2xl max-lg:border-l max-lg:border-border-custom max-lg:p-5 transition-transform duration-300 translate-x-full lg:hidden pointer-events-none lg:pointer-events-auto"
          } 
          id="quran-sidebar"
        >
          
          {/* Index Header & Mode Switcher */}
          <div className="flex flex-col gap-3 pb-2 border-b border-border-custom" id="sidebar-header">
            <div className="flex items-center justify-between gap-2" id="sidebar-header-title-row">
              <button 
                onClick={() => setShowSidebar(false)} 
                className="lg:hidden p-1.5 rounded-xl hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="إغلاق الفهرس"
                id="btn-close-sidebar-mobile"
              >
                <span className="text-xl font-bold font-sans">×</span>
              </button>
              <h3 className="arabic-text text-md font-extrabold text-text-primary">مصحف زاد المعرفة</h3>
            </div>
            
            {/* Search mode toggler */}
            <div className="flex rounded-full border border-border-custom p-0.5 bg-surface-muted w-full" id="search-mode-toggle">
              <button
                onClick={() => {
                  setSearchMode('index');
                  setQuranSearchQuery('');
                }}
                className={`flex-1 rounded-full py-1.5 text-xs font-bold arabic-text transition-all cursor-pointer ${
                  searchMode === 'index' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                id="btn-mode-index"
              >
                فهرس السور
              </button>
              <button
                onClick={() => {
                  setSearchMode('global');
                  setQuranSearchQuery('');
                }}
                className={`flex-1 rounded-full py-1.5 text-xs font-bold arabic-text transition-all cursor-pointer ${
                  searchMode === 'global' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                id="btn-mode-global"
              >
                البحث المتقدم
              </button>
            </div>
          </div>

          {/* Search Inputs based on mode */}
          {searchMode === 'index' ? (
            /* Standard Surah index search */
            <div className="relative w-full" id="search-surah-wrapper">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="ابحث عن سورة بالاسم..."
                value={quranSearchQuery}
                onChange={(e) => setQuranSearchQuery(e.target.value)}
                className="arabic-text text-xs w-full rounded-full border border-border-custom bg-surface py-2.5 pr-10 pl-4 focus:outline-none focus:border-primary transition-colors text-right font-medium"
                id="search-surah-input"
              />
            </div>
          ) : (
            /* Global Live Text Search */
            <div className="flex flex-col gap-2" id="global-search-block">
              <div className="relative w-full">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="ابحث عن كلمة أو عبارة قرآنية..."
                  value={quranSearchQuery}
                  onChange={(e) => setQuranSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                  className="arabic-text text-xs w-full rounded-full border border-border-custom bg-surface py-2.5 pr-10 pl-4 focus:outline-none focus:border-primary transition-colors text-right font-medium"
                  id="search-global-input"
                />
              </div>
              <button
                onClick={handleGlobalSearch}
                className="w-full bg-primary text-white rounded-full text-xs font-bold py-2 shadow-sm hover:bg-primary-hover transition-colors cursor-pointer"
                id="btn-trigger-global-search"
              >
                {loadingSearch ? 'جاري البحث...' : 'ابحث في المصحف'}
              </button>
            </div>
          )}

          {/* Sidebar scrollable container */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1" id="sidebar-scrollable-content">
            
            {/* 1. Surah index display */}
            {searchMode === 'index' && (
              <>
                {loadingChapters ? (
                  <div className="flex flex-col items-center justify-center py-10" id="chapters-loader">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                  </div>
                ) : (
                  filteredChapters.map((surah) => {
                    const isActive = selectedSurahNum === surah.id;
                    return (
                      <button
                        key={surah.id}
                        onClick={() => setSelectedSurahNum(surah.id)}
                        className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all border text-right cursor-pointer active-press ${
                          isActive 
                            ? 'bg-primary border-primary text-white shadow-md' 
                            : 'bg-surface border-border-custom/50 text-text-primary hover:border-primary/20 hover:bg-surface-muted/30'
                        }`}
                        id={`surah-btn-${surah.id}`}
                      >
                        {/* Left: Verses Count & origin details */}
                        <div className="text-left" id={`surah-left-${surah.id}`}>
                          <span className={`arabic-text text-[10px] font-bold block ${isActive ? 'text-white/90' : 'text-text-secondary'}`}>
                            {surah.versesCount} {isAr ? 'آيات' : 'Verses'}
                          </span>
                          <span className={`text-[9px] font-sans font-bold block ${isActive ? 'text-white/80' : 'text-text-secondary/70'}`}>
                            {surah.revelationPlace === 'makkah' ? 'MECCAN' : 'MEDINAN'}
                          </span>
                        </div>

                        {/* Right: Surah Name, English translation, and Number Badge */}
                        <div className="flex items-center gap-3" id={`surah-right-${surah.id}`}>
                          <div className="text-right" id={`surah-meta-${surah.id}`}>
                            <span className="arabic-text font-black text-sm block">
                              {surah.nameArabic}
                            </span>
                            <span className={`text-[10px] font-sans font-bold block ${isActive ? 'text-white/90' : 'text-text-secondary'}`}>
                              {surah.nameSimple}
                            </span>
                          </div>

                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-sans font-extrabold text-xs ${
                            isActive ? 'bg-white/20 text-white' : 'bg-surface-muted text-primary border border-border-custom'
                          }`} id={`surah-number-${surah.id}`}>
                            {surah.id}
                          </div>
                        </div>

                      </button>
                    );
                  })
                )}

                {filteredChapters.length === 0 && !loadingChapters && (
                  <p className="arabic-text text-xs font-semibold text-text-secondary text-center py-6">
                    لا توجد سور مطابقة لاسم بحثك.
                  </p>
                )}
              </>
            )}

            {/* 2. Global live search results display */}
            {searchMode === 'global' && (
              <div className="flex flex-col gap-3" id="global-search-results-pane">
                {loadingSearch ? (
                  <div className="flex flex-col items-center justify-center py-10" id="search-results-loader">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    <p className="arabic-text text-xs font-bold text-text-secondary mt-3">جاري البحث في المصحف الشريف...</p>
                  </div>
                ) : (
                  <>
                    <p className="arabic-text text-[10px] font-bold text-text-secondary text-right px-1">
                      تم العثور على {globalResults.length} نتائج مطابقة للبحث
                    </p>

                    {globalResults.map((res, idx) => {
                      const [surahId, verseId] = res.verseKey.split(':');
                      return (
                        <div
                          key={idx}
                          className="w-full p-4 rounded-2xl bg-surface border border-border-custom hover:border-primary/30 transition-all text-right flex flex-col gap-2 shadow-sm"
                          id={`search-res-item-${idx}`}
                        >
                          <div className="flex items-center justify-between border-b border-border-custom/50 pb-1.5">
                            <button
                              onClick={() => {
                                setSelectedSurahNum(parseInt(surahId));
                                // Auto scroll to verse on small timeout
                                setTimeout(() => {
                                  const el = document.getElementById(`verse-row-${verseId}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 500);
                              }}
                              className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              عرض في المصحف <ChevronRight className="h-3 w-3" />
                            </button>
                            <span className="arabic-text text-[10px] font-bold bg-primary/5 text-primary px-2.5 py-0.5 rounded-full">
                              سورة {surahId} | الآية {verseId}
                            </span>
                          </div>

                          <p className="quran-text text-lg text-text-primary text-right leading-relaxed" dir="rtl" lang="ar">
                            {res.textUthmani}
                          </p>

                          {res.translationText && (
                            <p className="text-[10px] text-text-secondary text-left font-sans italic pt-1 border-t border-border-custom/30 leading-normal">
                              {res.translationText}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {globalResults.length === 0 && !loadingSearch && quranSearchQuery && (
                      <p className="arabic-text text-xs font-semibold text-text-secondary text-center py-6">
                        لا توجد نتائج مطابقة لعبارة البحث الخاصة بك.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
