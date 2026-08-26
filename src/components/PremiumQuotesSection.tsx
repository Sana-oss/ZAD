import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { quoteService, Quote, getScriptureType } from '../services/quoteService';
import {
  premiumQuoteImageService,
  QuoteImageFormat,
} from '../services/premiumQuoteImageService';
import {
  Shuffle,
  Download,
  Share2,
  Search,
  Loader,
  Heart,
  TrendingUp,
  X,
  SlidersHorizontal,
} from 'lucide-react';

const FORMATS: { id: QuoteImageFormat; labelEn: string; labelAr: string }[] = [
  { id: 'instagram', labelEn: 'Instagram', labelAr: 'إنستغرام' },
  { id: 'pinterest', labelEn: 'Pinterest', labelAr: 'بينتريست' },
  { id: 'twitter', labelEn: 'Twitter / X', labelAr: 'تويتر' },
];

type QuoteFilter = 'all' | 'hadith' | 'general';

const FILTERS: { id: QuoteFilter; labelEn: string; labelAr: string }[] = [
  { id: 'all', labelEn: 'All', labelAr: 'الكل' },
  { id: 'hadith', labelEn: 'Hadith', labelAr: 'حديث' },
  { id: 'general', labelEn: 'General', labelAr: 'عام' },
];

export const PremiumQuotesSection: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const { settings } = useApp();
  const isAr = settings.language === 'ar';
  const preferArabicForImage = isAr;

  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [format, setFormat] = useState<QuoteImageFormat>('instagram');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Quote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<QuoteFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [resultsDismissed, setResultsDismissed] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [mostShared, setMostShared] = useState(quoteService.getShareStats());
  const searchSeq = useRef(0);

  useEffect(() => {
    setFavorites(quoteService.getFavorites());
    loadRandomQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(
    (list: Quote[]): Quote[] =>
      list.filter((q) => {
        if (favoritesOnly && !favorites.includes(q.id)) return false;
        if (filter === 'hadith') return getScriptureType(q) === 'hadith';
        if (filter === 'general') return getScriptureType(q) === null;
        return true;
      }),
    [filter, favoritesOnly, favorites]
  );

  // Debounced search + filter-driven browse mode (empty query lists local pool)
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(
        applyFilters(quoteService.getAllLocalQuotes()).slice(0, 15)
      );
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => {
      executeSearch(q);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filter, favoritesOnly, applyFilters]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const loadRandomQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      // Bulk-fill the local corpus once per day (no-op when fresh).
      await quoteService.refreshRemotePool();
      const quote = await quoteService.getRandomQuote();
      setCurrentQuote(quote);
      // Refresh any open browse/search list with the now-larger corpus.
      setSearchResults((prev) =>
        prev.length > 0
          ? applyFilters(quoteService.getAllLocalQuotes()).slice(0, 15)
          : prev
      );
    } catch (err) {
      console.error('Error:', err);
      setError(isAr ? 'خطأ في تحميل الاقتباس' : 'Error loading quote');
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    const seq = ++searchSeq.current;
    setIsSearching(true);
    try {
      const results = await quoteService.searchQuotes(query);
      if (seq === searchSeq.current) setSearchResults(applyFilters(results));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      if (seq === searchSeq.current) setIsSearching(false);
    }
  };

  const handleSelectQuote = (quote: Quote) => {
    setCurrentQuote(quote);
    setResultsDismissed(true);
    setSearchQuery('');
  };

  const buildImage = async (): Promise<Blob> => {
    if (!currentQuote) throw new Error('No quote selected');
    return premiumQuoteImageService.generatePremiumImage(
      currentQuote,
      format,
      preferArabicForImage && !!currentQuote.textAr
    );
  };

  const afterShare = () => {
    if (!currentQuote) return;
    quoteService.trackShare(currentQuote);
    setMostShared(quoteService.getShareStats());
  };

  const handleDownloadImage = async () => {
    if (!currentQuote || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const blob = await buildImage();
      premiumQuoteImageService.downloadImage(blob, `zad-quote-${currentQuote.id}.png`);
      afterShare();
      showToast(isAr ? 'تم تحميل الصورة' : 'Image downloaded');
    } catch (err) {
      console.error('Error generating image:', err);
      setError(isAr ? 'خطأ في إنشاء الصورة' : 'Error generating image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareImage = async () => {
    if (!currentQuote || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const blob = await buildImage();
      const file = new File([blob], `zad-quote-${currentQuote.id}.png`, {
        type: 'image/png',
      });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      const shareData: ShareData = {
        title: isAr ? 'اقتباس ملهم من زاد' : 'Inspiring quote from ZAD',
        text: currentQuote.text,
        files: [file],
      };
      if (nav.share && (!nav.canShare || nav.canShare(shareData))) {
        await nav.share(shareData);
        afterShare();
      } else {
        const copied = await premiumQuoteImageService.copyToClipboard(blob);
        showToast(
          copied
            ? isAr
              ? 'تم نسخ الصورة إلى الحافظة'
              : 'Image copied to clipboard'
            : isAr
              ? 'تعذر نسخ الصورة'
              : 'Copy failed'
        );
        if (copied) afterShare();
      }
    } catch (err) {
      // User cancelled the native share sheet — not an error worth surfacing.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error('Share error:', err);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!currentQuote) return;
    const updated = favorites.includes(currentQuote.id)
      ? favorites.filter((id) => id !== currentQuote.id)
      : [...favorites, currentQuote.id];
    setFavorites(updated);
    quoteService.setFavorites(updated);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResultsDismissed(false);
  };

  const isFavorited = currentQuote ? favorites.includes(currentQuote.id) : false;
  const hasIntent =
    searchQuery.trim().length > 0 || filter !== 'all' || favoritesOnly;
  const shareCount = currentQuote
    ? mostShared.find((s) => s.quote.id === currentQuote.id)?.count ?? 0
    : 0;
  const scripture = currentQuote ? getScriptureType(currentQuote) : null;
  const displayText =
    preferArabicForImage && currentQuote?.textAr
      ? currentQuote.textAr
      : currentQuote?.text;
  const openMark = scripture === 'hadith' && isAr ? '\u00AB' : '';
  const closeMark = scripture === 'hadith' && isAr ? '\u00BB' : '';

  const sectionPad = embedded ? 'py-8' : 'py-12';

  return (
    <div className={`mx-auto max-w-5xl px-4 sm:px-6 ${sectionPad}`} id="premium-quotes">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className={`arabic-text font-black text-text-primary mb-2 ${
            embedded ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'
          }`}
        >
          {isAr ? 'الاقتباسات الملهمة' : 'Inspiring Quotes'}
        </h1>
        <p className="arabic-text text-sm sm:text-lg text-text-secondary">
          {isAr
            ? 'اقتباسات جميلة مع صور مصممة بأسلوب فاخر'
            : 'Beautiful quotes with premium shareable designs'}
        </p>
      </div>

      {/* Search Bar + Filters */}
      <div className="mb-8 relative z-20" id="quotes-search-container">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث عن اقتباس...' : 'Search quotes...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setResultsDismissed(false);
              }}
              onFocus={() => setResultsDismissed(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setResultsDismissed(false);
                  executeSearch(searchQuery);
                }
              }}
              className="w-full py-3 pr-12 pl-11 rounded-2xl border border-border-custom bg-surface text-text-primary placeholder:text-text-secondary focus:border-primary outline-none transition-colors"
              aria-label={isAr ? 'البحث في الاقتباسات' : 'Search quotes'}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-secondary hover:bg-surface-muted transition-colors"
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setResultsDismissed(false);
              executeSearch(searchQuery);
            }}
            disabled={isSearching}
            className="px-5 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all active-press disabled:opacity-50"
            aria-label={isAr ? 'بحث' : 'Search'}
          >
            {isSearching ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Filter Chips */}
        <div className="mt-3 flex items-center gap-2 flex-wrap" id="quotes-filter-chips">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="arabic-text">{isAr ? 'تصفية:' : 'Filter:'}</span>
          </span>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setFilter(f.id);
                  setResultsDismissed(false);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all active-press ${
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-muted text-text-secondary border border-border-custom hover:border-primary/40 hover:text-primary'
                }`}
              >
                <span className="arabic-text">{isAr ? f.labelAr : f.labelEn}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              setFavoritesOnly((v) => !v);
              setResultsDismissed(false);
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active-press ${
              favoritesOnly
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                : 'bg-surface-muted text-text-secondary border border-border-custom hover:border-rose-400/50 hover:text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
            <span className="arabic-text">{isAr ? 'المفضلة' : 'Favorites'}</span>
          </button>
        </div>

        {/* Search / Browse Results */}
        {!resultsDismissed && searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto rounded-2xl bg-surface border border-border-custom p-2 shadow-lg animate-fade-in-up">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectQuote(result)}
                className="w-full text-right p-3 rounded-xl bg-surface-muted hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all active-press"
              >
                <p className={`text-sm text-text-primary ${isAr ? 'arabic-text line-clamp-2' : 'line-clamp-2'}`}>
                  {result.text}
                </p>
                {result.author && (
                  <p className={`text-xs text-text-secondary mt-1 ${isAr ? 'arabic-text' : ''}`}>
                    — {result.author}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
        {!resultsDismissed && !isSearching && hasIntent && searchResults.length === 0 && (
          <p className="mt-2 text-xs text-text-secondary arabic-text">
            {isAr ? 'لا توجد نتائج مطابقة' : 'No matching quotes found'}
          </p>
        )}
      </div>

      {/* Quote Display */}
      {loading ? (
        <div
          className="rounded-3xl border-2 border-primary/20 bg-surface p-12 sm:p-16 mb-8 flex flex-col items-center justify-center gap-4 min-h-[280px]"
          id="quotes-card-skeleton"
        >
          <Loader className="h-9 w-9 text-primary animate-spin" />
          <div className="space-y-3 w-full max-w-md">
            <div className="h-4 rounded-full bg-surface-muted animate-pulse w-3/4 mx-auto" />
            <div className="h-4 rounded-full bg-surface-muted animate-pulse w-1/2 mx-auto" />
          </div>
        </div>
      ) : error && !currentQuote ? (
        <div className="text-center py-12 mb-8" id="quotes-error-state">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadRandomQuote}
            className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all active-press"
          >
            {isAr ? 'حاول مجدداً' : 'Try Again'}
          </button>
        </div>
      ) : currentQuote ? (
        <>
          {/* Premium Quote Card — warm parchment with double frame motif */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-lg mb-8 animate-fade-in-up border-2 border-accent-gold/30"
            id="quotes-display-card"
          >
            <div className="relative p-10 sm:p-14 bg-gradient-to-br from-accent-gold/10 via-surface to-[#e9dcc3]/25 dark:to-accent-gold/10">
              {/* Inner hairline echoing the generated images' double frame */}
              <div className="absolute inset-3 rounded-2xl border border-accent-gold/25 pointer-events-none select-none" />

              {/* Corner medallions */}
              <span className="absolute top-2 left-2 h-2.5 w-2.5 rounded-full bg-accent-gold/70 pointer-events-none select-none" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-accent-gold/70 pointer-events-none select-none" />
              <span className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full bg-accent-gold/70 pointer-events-none select-none" />
              <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-accent-gold/70 pointer-events-none select-none" />

              {/* Oversized serif quote marks */}
              <span className="absolute top-6 left-6 font-serif text-7xl text-accent-gold/20 leading-none pointer-events-none select-none">“</span>
              <span className="absolute bottom-6 right-6 font-serif text-7xl text-accent-gold/20 leading-none pointer-events-none select-none">”</span>

              <div className="relative z-10">
                {shareCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-gold/15 border border-accent-gold/30 px-3 py-1 text-[11px] font-semibold text-accent-gold mb-4">
                    <TrendingUp className="h-3 w-3" />
                    {isAr ? `تمت مشاركته ${shareCount} مرة` : `shared ${shareCount}×`}
                  </span>
                )}

                <p
                  className={`${isAr && currentQuote.textAr ? 'arabic-text' : 'font-serif'} text-2xl sm:text-4xl font-bold text-text-primary text-center mb-6 leading-relaxed`}
                  dir={isAr && currentQuote.textAr ? 'rtl' : 'ltr'}
                >
                  {openMark}
                  {displayText}
                  {closeMark}
                </p>

                {preferArabicForImage &&
                  currentQuote.textAr &&
                  currentQuote.text !== currentQuote.textAr && (
                    <p className="text-sm sm:text-base text-text-secondary text-center mb-4 line-clamp-2">
                      {currentQuote.text}
                    </p>
                  )}

                {currentQuote.source && (
                  <p className={`text-sm text-accent-gold text-center ${isAr ? 'arabic-text' : 'italic font-serif'}`}>
                    — {currentQuote.source}
                  </p>
                )}

                {currentQuote.author && (
                  <p className={`text-base font-semibold text-text-secondary text-center mt-1 ${isAr ? 'arabic-text' : 'font-serif'}`}>
                    {currentQuote.author}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-8" id="quotes-format-selector">
            <p className="arabic-text text-sm font-semibold text-text-secondary mb-3">
              {isAr ? 'الصيغة:' : 'Share format:'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active-press ${
                    format === f.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface-muted text-text-secondary border border-border-custom hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {isAr ? f.labelAr : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" id="quotes-actions-grid">
            <button
              onClick={loadRandomQuote}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary text-white px-6 py-3 font-semibold shadow-md hover:shadow-lg hover:bg-primary-hover transition-all active-press"
            >
              <Shuffle className="h-5 w-5" />
              <span className="arabic-text">{isAr ? 'اقتباس جديد' : 'New Quote'}</span>
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold shadow-sm transition-all active-press ${
                isFavorited
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                  : 'bg-surface-muted text-text-secondary border border-border-custom hover:border-rose-400/50 hover:text-rose-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              <span className="arabic-text">{isAr ? 'مفضل' : 'Favorite'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-6 py-3 font-semibold shadow-md hover:bg-emerald-700 transition-all active-press disabled:opacity-50"
            >
              {isGeneratingImage ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              <span className="arabic-text">{isAr ? 'تحميل' : 'Download'}</span>
            </button>

            <button
              onClick={handleShareImage}
              disabled={isGeneratingImage}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white px-6 py-3 font-semibold shadow-md hover:bg-blue-700 transition-all active-press disabled:opacity-50"
            >
              {isGeneratingImage ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
              <span className="arabic-text">{isAr ? 'شارك' : 'Share'}</span>
            </button>
          </div>

          {/* Quote Details */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4" id="quotes-details-grid">
            {[
              { labelEn: 'Author', labelAr: 'الكاتب', value: currentQuote.author },
              { labelEn: 'Source', labelAr: 'المصدر', value: currentQuote.source },
              { labelEn: 'Category', labelAr: 'الفئة', value: currentQuote.category },
            ].map((item) => (
              <div
                key={item.labelEn}
                className="rounded-2xl bg-surface-muted/60 border border-border-custom p-4 text-center transition-colors hover:border-accent-gold/40"
              >
                <p className="text-[11px] text-text-secondary mb-1 uppercase tracking-wider">
                  {isAr ? item.labelAr : item.labelEn}
                </p>
                <p className="text-sm font-semibold text-text-primary capitalize truncate">
                  {item.value || (isAr ? 'عام' : 'General')}
                </p>
              </div>
            ))}
          </div>

          {/* Most Shared */}
          {mostShared.length > 0 && (
            <div className="mt-8" id="quotes-most-shared">
              <p className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-3">
                <TrendingUp className="h-4 w-4 text-accent-gold" />
                <span className="arabic-text">{isAr ? 'الأكثر مشاركة' : 'Most Shared'}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {mostShared.slice(0, 3).map((stat) => (
                  <button
                    key={stat.quote.id}
                    onClick={() => handleSelectQuote(stat.quote)}
                    className="text-right p-4 rounded-2xl bg-surface border border-border-custom hover:border-accent-gold/50 transition-all active-press group"
                  >
                    <p className={`text-xs text-text-secondary line-clamp-2 group-hover:text-text-primary transition-colors ${isAr ? 'arabic-text' : ''}`}>
                      {stat.quote.text}
                    </p>
                    <p className="text-[11px] font-bold text-accent-gold mt-2 arabic-text">
                      ×{stat.count}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up" role="status">
          <div className="rounded-2xl bg-text-primary text-[var(--background)] px-5 py-3 shadow-2xl">
            <p className="arabic-text text-sm font-semibold whitespace-nowrap">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
};
