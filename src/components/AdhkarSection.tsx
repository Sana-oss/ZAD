import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DHIKR_LIST, CATEGORIES } from '../data/adhkar';
import { ArrowLeft, Search, Heart, Share2, Copy, Check, RotateCcw, Volume2, Sparkles, ShieldCheck } from 'lucide-react';

export const AdhkarSection: React.FC = () => {
  const { 
    activeCategory, 
    setActiveCategory, 
    settings, 
    toggleFavorite, 
    isFavorite,
    adhkarSearchQuery,
    setAdhkarSearchQuery,
    dhikrCounts,
    incrementDhikrCount,
    setDhikrCounts,
    playingAudio,
    setPlayingAudio,
    audioPlaying,
    setAudioPlaying
  } = useApp();

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAr = settings.language === 'ar';

  // Get current category info
  const categoryInfo = CATEGORIES.find((c) => c.id === activeCategory);

  // Filter Adhkar list
  const filteredDhikr = DHIKR_LIST.filter((d) => {
    // Filter by active category (if inside a category) or show all
    if (activeCategory && d.category !== activeCategory) return false;
    
    // Filter by favorites
    if (favoritesOnly && !isFavorite(d.id)) return false;

    // Filter by search query
    if (adhkarSearchQuery) {
      const query = adhkarSearchQuery.toLowerCase();
      const textMatch = d.text.toLowerCase().includes(query);
      const refMatch = d.reference.toLowerCase().includes(query);
      const transMatch = d.translation?.toLowerCase().includes(query) || false;
      return textMatch || refMatch || transMatch;
    }

    return true;
  });

  const handleCopy = async (text: string, reference: string, id: string) => {
    try {
      await navigator.clipboard.writeText(`"${text}" [المصدر: ${reference}] - عبر تطبيق زاد`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (text: string, reference: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'ذكر مأثور من زاد',
        text: `"${text}" [${reference}]`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert(isAr ? 'تم نسخ الرابط ومحتوى الذكر للمشاركة!' : 'Dhikr copied to share!');
    }
  };

  const handleResetProgress = () => {
    if (window.confirm(isAr ? 'هل تود إعادة ضبط جميع العدادات لهذه الفئة؟' : 'Reset all counts for this category?')) {
      if (activeCategory) {
        setDhikrCounts((prev) => {
          const copy = { ...prev };
          filteredDhikr.forEach((d) => {
            delete copy[d.id];
          });
          return copy;
        });
      }
    }
  };

  // Helper to highlight matching query text
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    // Split on search terms while keeping case matching
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} className="bg-amber-100 dark:bg-amber-900/60 text-[#005c55] font-extrabold px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8" id="adhkar-section">
      
      {/* Category Selection view / Category list */}
      {!activeCategory && (
        <div className="flex flex-col gap-6" id="categories-root-view">
          
          {/* Header Title */}
          <div className="text-center mb-4" id="categories-root-title">
            <h1 className="arabic-text text-2xl sm:text-3xl font-black text-text-primary mb-2">الأذكار النبوية</h1>
            <p className="arabic-text text-xs text-text-secondary">موسوعة كاملة من الأذكار الصحيحة المأثورة والتحصينات اليومية</p>
          </div>

          {/* Favorites tab toggle & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between" id="search-favorites-bar">
            
            {/* Live Search */}
            <div className="relative w-full sm:w-80" id="search-input-wrapper">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder={isAr ? 'ابحث في الأذكار والمصادر...' : 'Search Adhkar...'}
                value={adhkarSearchQuery}
                onChange={(e) => setAdhkarSearchQuery(e.target.value)}
                className="arabic-text text-xs w-full rounded-full border border-border-custom bg-surface py-2.5 pr-10 pl-4 focus:outline-none focus:border-primary transition-colors text-right"
                id="search-adhkar-input"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 w-full sm:w-auto" id="filter-tabs-row">
              <button
                onClick={() => setFavoritesOnly(false)}
                className={`flex-1 sm:flex-initial rounded-full px-5 py-2 text-xs font-semibold arabic-text transition-all active-press ${
                  !favoritesOnly 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface border border-border-custom text-text-secondary hover:text-text-primary'
                }`}
                id="btn-all-adhkar"
              >
                جميع الأذكار
              </button>
              <button
                onClick={() => setFavoritesOnly(true)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold arabic-text transition-all active-press ${
                  favoritesOnly 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface border border-border-custom text-text-secondary hover:text-text-primary'
                }`}
                id="btn-favorites-adhkar"
              >
                <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-white' : ''}`} />
                المفضلة
              </button>
            </div>

          </div>

          {/* List of categories available */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2" id="grid-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="group p-5 rounded-3xl border border-border-custom bg-surface text-right flex flex-col gap-3 justify-between shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md cursor-pointer active-press"
                id={`cat-list-btn-${cat.id}`}
              >
                <div className="flex justify-between items-start w-full" id={`cat-list-header-${cat.id}`}>
                  {cat.badge && (
                    <span className="arabic-text text-[10px] font-bold bg-primary/5 text-primary rounded-full px-2.5 py-0.5" id={`cat-badge-${cat.id}`}>
                      {cat.badge}
                    </span>
                  )}
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted transition-all group-hover:bg-primary/5" id={`cat-list-icon-${cat.id}`}>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div id={`cat-list-body-${cat.id}`}>
                  <h3 className="arabic-text text-md font-bold text-text-primary group-hover:text-primary transition-colors">
                    {isAr ? cat.nameAr : cat.nameEn}
                  </h3>
                  <p className="arabic-text text-xs text-text-secondary mt-1 leading-normal">
                    {isAr ? cat.descriptionAr : cat.descriptionEn}
                  </p>
                </div>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Inside selected category / Detailed cards */}
      {activeCategory && categoryInfo && (
        <div className="flex flex-col gap-6" id="category-detail-view">
          
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-border-custom pb-4" id="category-detail-header">
            
            {/* Reset Progress Button */}
            <button
              onClick={handleResetProgress}
              className="text-xs font-semibold text-text-secondary hover:text-red-500 flex items-center gap-1 p-2 rounded-full hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all active-press"
              title="إعادة ضبط العدادات"
              id="btn-reset-category-counts"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="arabic-text hidden sm:inline">إعادة ضبط العدادات</span>
            </button>

            {/* Title / Info */}
            <div className="text-right" id="category-title-block">
              <h1 className="arabic-text text-xl sm:text-2xl font-black text-text-primary flex items-center justify-end gap-2">
                {isAr ? categoryInfo.nameAr : categoryInfo.nameEn}
                <Sparkles className="h-5 w-5 text-accent-gold" />
              </h1>
              <p className="arabic-text text-xs text-text-secondary mt-1">
                {isAr ? categoryInfo.descriptionAr : categoryInfo.descriptionEn}
              </p>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setActiveCategory(null);
                setAdhkarSearchQuery('');
              }}
              className="rounded-full border border-border-custom p-2 hover:bg-surface-muted text-text-primary transition-all active-press"
              aria-label="Back to categories"
              id="btn-back-to-categories"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

          </div>

          {/* Secondary Filter bar */}
          <div className="relative w-full" id="inner-search-input-wrapper">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث في محتوى هذه الأذكار...' : 'Search within these Adhkar...'}
              value={adhkarSearchQuery}
              onChange={(e) => setAdhkarSearchQuery(e.target.value)}
              className="arabic-text text-xs w-full rounded-full border border-border-custom bg-surface py-2.5 pr-10 pl-4 focus:outline-none focus:border-primary transition-colors text-right"
              id="inner-search-adhkar-input"
            />
          </div>

          {/* Cards list */}
          <div className="flex flex-col gap-5 mt-2" id="dhikr-cards-list">
            {filteredDhikr.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-border-custom" id="dhikr-empty-state">
                <ShieldCheck className="mx-auto h-12 w-12 text-text-secondary/40 mb-3" />
                <p className="arabic-text text-sm font-bold text-text-secondary">
                  {isAr ? 'لا توجد نتائج مطابقة لمصطلح البحث أو المفضلة.' : 'No matching results found.'}
                </p>
              </div>
            ) : (
              filteredDhikr.map((d, index) => {
                const currentCount = dhikrCounts[d.id] || 0;
                const isCompleted = currentCount >= d.count;
                const isFav = isFavorite(d.id);

                return (
                  <div
                    key={d.id}
                    className={`group relative rounded-3xl border transition-all duration-300 p-6 flex flex-col gap-5 ${
                      isCompleted 
                        ? 'border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm opacity-80' 
                        : 'border-border-custom bg-surface shadow-sm hover:shadow-md hover:border-primary/15'
                    }`}
                    id={`dhikr-card-${d.id}`}
                  >
                    
                    {/* Top Content Row: Counter (Left) & Dhikr text (Right) */}
                    <div className="flex gap-5 sm:gap-6 items-start justify-between" id={`dhikr-card-main-${d.id}`}>
                      
                      {/* Interactive Ring Circle Counter (Left) - Inspired by Image 3 */}
                      <button
                        onClick={() => incrementDhikrCount(d.id, d.count)}
                        className={`relative flex-shrink-0 flex flex-col items-center justify-center h-16 w-16 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' 
                            : 'border-border-custom bg-surface-muted/50 text-text-primary hover:border-primary/30 group-hover:scale-105'
                        }`}
                        aria-label="Increment repeat counter"
                        id={`dhikr-card-counter-${d.id}`}
                      >
                        <span className="font-sans text-lg font-extrabold tracking-tight">
                          {isCompleted ? <Check className="h-5 w-5" /> : d.count - currentCount}
                        </span>
                        {!isCompleted && (
                          <span className="arabic-text text-[9px] font-medium leading-none text-text-secondary -mt-0.5">
                            {d.count > 10 ? 'مرة' : 'مرات'}
                          </span>
                        )}
                      </button>

                      {/* Text block (Right) */}
                      <div className="flex flex-col gap-2 text-right flex-grow" id={`dhikr-card-text-wrapper-${d.id}`}>
                        <p 
                          onClick={() => incrementDhikrCount(d.id, d.count)}
                          className="arabic-text text-base sm:text-lg font-semibold leading-relaxed text-text-primary cursor-pointer active:opacity-90 select-all"
                          id={`dhikr-text-${d.id}`}
                        >
                          {highlightText(d.text, adhkarSearchQuery)}
                        </p>
                        
                        {d.benefit && (
                          <p className="arabic-text text-[11px] font-semibold text-primary bg-primary/5 rounded-xl px-3 py-1.5 mt-2 self-end leading-relaxed" id={`dhikr-benefit-${d.id}`}>
                            {highlightText(d.benefit, adhkarSearchQuery)}
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Bottom Action Footer Row */}
                    <div className="flex items-center justify-between border-t border-border-custom/50 pt-4" id={`dhikr-card-footer-${d.id}`}>
                      
                      {/* Left: Actions (Copy, Favorite, Share) */}
                      <div className="flex items-center gap-1" id={`dhikr-card-left-actions-${d.id}`}>
                        
                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(d.text, d.reference, d.id)}
                          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all active-press"
                          title="نسخ الذكر"
                          id={`btn-copy-dhikr-${d.id}`}
                        >
                          {copiedId === d.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>

                        {/* Favorite */}
                        <button
                          onClick={() => toggleFavorite(d.id)}
                          className="p-2 rounded-full text-text-secondary hover:text-red-500 hover:bg-surface-muted transition-all active-press"
                          title="أضف للمفضلة"
                          id={`btn-fav-dhikr-${d.id}`}
                        >
                          <Heart className={`h-4 w-4 transition-transform active:scale-125 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => handleShare(d.text, d.reference)}
                          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all active-press"
                          title="مشاركة الذكر"
                          id={`btn-share-dhikr-${d.id}`}
                        >
                          <Share2 className="h-4 w-4" />
                        </button>

                        {/* Play/Pause Recitation */}
                        <button
                          onClick={() => {
                            if (playingAudio && playingAudio.id === d.id) {
                              setAudioPlaying(!audioPlaying);
                            } else {
                              const isQuran = ['p4', 'm3', 'e5', 's4'].includes(d.id);
                              const title = isQuran
                                ? (isAr ? 'تلاوة قرآنية مأثورة' : 'Noble Quranic Recitation')
                                : (isAr ? categoryInfo.nameAr : categoryInfo.nameEn);
                              setPlayingAudio({
                                id: d.id,
                                text: d.text,
                                title,
                                category: d.category,
                                isQuran
                              });
                            }
                          }}
                          className={`p-2 rounded-full transition-all active-press ${
                            playingAudio && playingAudio.id === d.id
                              ? 'text-primary bg-primary/10'
                              : 'text-text-secondary hover:text-primary hover:bg-surface-muted'
                          }`}
                          title={playingAudio && playingAudio.id === d.id && audioPlaying ? 'إيقاف مؤقت' : 'استمع للذكر'}
                          id={`btn-play-dhikr-${d.id}`}
                        >
                          {playingAudio && playingAudio.id === d.id && audioPlaying ? (
                            <div className="flex gap-0.5 items-center justify-center h-4 w-4" id={`dhikr-card-playing-indicator-${d.id}`}>
                              <span className="h-2 w-0.5 bg-primary animate-pulse" />
                              <span className="h-3.5 w-0.5 bg-primary animate-pulse" style={{ animationDelay: '0.15s' }} />
                              <span className="h-2 w-0.5 bg-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
                            </div>
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </button>

                      </div>

                      {/* Right: Sources / Reference */}
                      <p className="arabic-text text-[11px] font-medium text-text-secondary/75 italic" id={`dhikr-card-ref-${d.id}`}>
                        {highlightText(d.reference, adhkarSearchQuery)}
                      </p>

                    </div>

                    {/* Completion Border overlay indicator */}
                    {isCompleted && (
                      <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 shadow-sm" id={`dhikr-card-overlay-badge-${d.id}`} />
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
};
