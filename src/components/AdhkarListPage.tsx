import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DHIKR_LIST, CATEGORIES } from '../data/adhkar';
import { DhikrCategory } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Heart,
  Share2,
  RotateCcw,
  Volume2,
  Sun,
  Moon,
  Bed,
  Compass,
  Home,
  DoorOpen,
  UtensilsCrossed,
  Smile,
  Droplets,
  HeartPulse,
  Shield,
  Plane,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
} from 'lucide-react';

const getCategoryIcon = (iconName: string, className: string = "h-5 w-5") => {
  const cls = className;
  switch (iconName) {
    case 'Sun': return <Sun className={cls} />;
    case 'Moon': return <Moon className={cls} />;
    case 'Bed': return <Bed className={cls} />;
    case 'Compass': return <Compass className={cls} />;
    case 'Home': return <Home className={cls} />;
    case 'DoorOpen': return <DoorOpen className={cls} />;
    case 'UtensilsCrossed': return <UtensilsCrossed className={cls} />;
    case 'Mouth': return <Smile className={cls} />;
    case 'Droplets': return <Droplets className={cls} />;
    case 'HeartPulse': return <HeartPulse className={cls} />;
    case 'Shield': return <Shield className={cls} />;
    case 'Heart': return <Heart className={cls} />;
    case 'Search': return <Sparkles className={cls} />;
    case 'Plane': return <Plane className={cls} />;
    case 'Sparkles': return <Sparkles className={cls} />;
    default: return <Sparkles className={cls} />;
  }
};

export const AdhkarListPage: React.FC = () => {
  const {
    settings,
    dhikrCounts,
    incrementDhikrCount,
    setDhikrCounts,
    markCategoryCompleted,
    toggleFavorite,
    isFavorite,
    activeCategory,
    setActiveCategory,
  } = useApp();

  const isAr = settings.language === 'ar';

  // Local state
  const [selectedTab, setSelectedTab] = useState<DhikrCategory>(
    (activeCategory as DhikrCategory) || 'morning'
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get adhkar for the selected category
  const categoryDhikr = DHIKR_LIST.filter((d) => d.category === selectedTab);
  const currentDhikr = categoryDhikr[currentIndex];
  const totalInCategory = categoryDhikr.length;

  // Progress: how many dhikr in this category are completed
  const completedCount = categoryDhikr.filter(
    (d) => (dhikrCounts[d.id] || 0) >= d.count
  ).length;
  const progressPercent = totalInCategory > 0 ? (completedCount / totalInCategory) * 100 : 0;

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedTab]);

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector(`[data-tab="${selectedTab}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedTab]);

  const handleCopy = async (text: string, reference: string, id: string) => {
    try {
      await navigator.clipboard.writeText(
        `"${text}" [المصدر: ${reference}] - عبر تطبيق زاد`
      );
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
    }
  };

  const handleResetCategory = () => {
    if (
      window.confirm(
        isAr
          ? 'هل تود إعادة ضبط جميع العدادات لهذه الفئة؟'
          : 'Reset all counts for this category?'
      )
    ) {
      setDhikrCounts((prev) => {
        const copy = { ...prev };
        categoryDhikr.forEach((d) => {
          delete copy[d.id];
        });
        return copy;
      });
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < totalInCategory - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalInCategory]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const incrementAndCheck = useCallback(() => {
    if (!currentDhikr) return;
    incrementDhikrCount(currentDhikr.id, currentDhikr.count);

    const newCount = (dhikrCounts[currentDhikr.id] || 0) + 1;
    if (newCount >= currentDhikr.count) {
      // Check if all dhikr in category are completed
      const allDone = categoryDhikr.every((item) => {
        const count = item.id === currentDhikr.id ? newCount : (dhikrCounts[item.id] || 0);
        return count >= item.count;
      });
      if (allDone) {
        markCategoryCompleted(selectedTab);
      }
      // Auto-advance to next dhikr if not at the end
      if (currentIndex < totalInCategory - 1) {
        setTimeout(() => setCurrentIndex((prev) => prev + 1), 400);
      }
    }
  }, [currentDhikr, dhikrCounts, categoryDhikr, currentIndex, totalInCategory, selectedTab, incrementDhikrCount, markCategoryCompleted]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 50) {
      if (touchDelta > 0 && currentIndex > 0) {
        goToPrev();
      } else if (touchDelta < 0 && currentIndex < totalInCategory - 1) {
        goToNext();
      }
    }
    setTouchStart(null);
    setTouchDelta(0);
    setIsSwiping(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        isAr ? goToPrev() : goToNext();
      } else if (e.key === 'ArrowRight') {
        isAr ? goToNext() : goToPrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        incrementAndCheck();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, incrementAndCheck, isAr]);

  if (!currentDhikr) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center py-12 bg-surface rounded-3xl border border-dashed border-border-custom">
          <ShieldCheck className="mx-auto h-12 w-12 text-text-secondary/40 mb-3" />
          <p className="arabic-text text-sm font-bold text-text-secondary">
            {isAr ? 'لا توجد أذكار في هذا القسم' : 'No adhkar in this section'}
          </p>
        </div>
      </div>
    );
  }

  const currentCount = dhikrCounts[currentDhikr.id] || 0;
  const isCompleted = currentCount >= currentDhikr.count;
  const remaining = Math.max(0, currentDhikr.count - currentCount);
  const isFav = isFavorite(currentDhikr.id);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-6 min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-right">
          <h1 className="arabic-text text-xl sm:text-2xl font-black text-text-primary">
            {isAr ? 'الأذكار النبوية' : 'Prophetic Adhkar'}
          </h1>
          <p className="arabic-text text-xs text-text-secondary mt-1">
            {isAr ? `${completedCount} من ${totalInCategory} مكتمل` : `${completedCount} of ${totalInCategory} completed`}
          </p>
        </div>
        <button
          onClick={handleResetCategory}
          className="p-2 rounded-full border border-border-custom hover:bg-surface-muted text-text-secondary hover:text-red-500 transition-all active-press"
          title={isAr ? 'إعادة ضبط' : 'Reset'}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-surface-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Category Tabs */}
      <div
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {CATEGORIES.map((cat) => {
          const catCount = DHIKR_LIST.filter((d) => d.category === cat.id).length;
          const catCompleted = DHIKR_LIST.filter(
            (d) => d.category === cat.id && (dhikrCounts[d.id] || 0) >= d.count
          ).length;
          const isActive = selectedTab === cat.id;

          return (
            <button
              key={cat.id}
              data-tab={cat.id}
              onClick={() => setSelectedTab(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 snap-center active-press ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface border border-border-custom text-text-secondary hover:border-primary/25'
              }`}
            >
              {getCategoryIcon(cat.icon, "h-4 w-4")}
              <span className="arabic-text whitespace-nowrap">
                {isAr ? cat.nameAr : cat.nameEn}
              </span>
              {catCompleted === catCount && catCount > 0 && (
                <Check className="h-3 w-3 text-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Swipeable Card Area */}
      <div
        ref={cardRef}
        className="flex-1 flex flex-col relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator + prev/next arrows */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`p-2 rounded-full border transition-all active-press ${
              currentIndex === 0
                ? 'border-border-custom/50 text-text-secondary/30 cursor-not-allowed'
                : 'border-border-custom text-text-primary hover:bg-surface-muted'
            }`}
          >
            {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          <span className="arabic-text text-xs font-bold text-text-secondary bg-surface-muted px-3 py-1 rounded-full">
            {currentIndex + 1} / {totalInCategory}
          </span>

          <button
            onClick={goToNext}
            disabled={currentIndex === totalInCategory - 1}
            className={`p-2 rounded-full border transition-all active-press ${
              currentIndex === totalInCategory - 1
                ? 'border-border-custom/50 text-text-secondary/30 cursor-not-allowed'
                : 'border-border-custom text-text-primary hover:bg-surface-muted'
            }`}
          >
            {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Dhikr Card */}
        <div
          className={`flex-1 rounded-3xl border transition-all duration-300 p-6 sm:p-8 flex flex-col gap-5 ${
            isCompleted
              ? 'border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm'
              : 'border-border-custom bg-surface shadow-sm'
          }`}
          style={{
            transform: isSwiping ? `translateX(${touchDelta * 0.3}px)` : 'none',
            transition: isSwiping ? 'none' : 'transform 0.3s ease',
          }}
        >
          {/* Dhikr Text */}
          <div className="text-right flex-1">
            <p className="arabic-text text-lg sm:text-xl md:text-2xl font-semibold leading-loose text-text-primary select-all">
              {currentDhikr.text}
            </p>
            {currentDhikr.translation && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed" dir="ltr">
                {currentDhikr.translation}
              </p>
            )}
            {currentDhikr.benefit && (
              <p className="arabic-text text-xs font-semibold text-primary bg-primary/5 rounded-2xl px-4 py-2 mt-4 inline-block leading-relaxed">
                {currentDhikr.benefit}
              </p>
            )}
          </div>

          {/* Reference */}
          <p className="arabic-text text-[11px] text-text-secondary text-left" dir="ltr">
            {currentDhikr.reference}
          </p>

          {/* Counter & Actions */}
          <div className="flex items-center justify-between border-t border-border-custom/50 pt-5">
            {/* Left: Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy(currentDhikr.text, currentDhikr.reference, currentDhikr.id)}
                className="p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all active-press"
                title={isAr ? 'نسخ' : 'Copy'}
              >
                {copiedId === currentDhikr.id ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => toggleFavorite(currentDhikr.id)}
                className="p-2.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-surface-muted transition-all active-press"
                title={isAr ? 'المفضلة' : 'Favorite'}
              >
                <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                onClick={() => handleShare(currentDhikr.text, currentDhikr.reference)}
                className="p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-all active-press"
                title={isAr ? 'مشاركة' : 'Share'}
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Big Counter Button */}
            <button
              onClick={incrementAndCheck}
              className={`relative flex flex-col items-center justify-center h-20 w-20 rounded-full border-2 transition-all duration-200 cursor-pointer active-press ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                  : 'border-primary/30 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10 active:scale-95'
              }`}
            >
              {isCompleted ? (
                <Check className="h-7 w-7" />
              ) : (
                <>
                  <span className="text-2xl font-sans font-extrabold tracking-tight leading-none">
                    {remaining}
                  </span>
                  <span className="arabic-text text-[10px] font-medium text-primary/70 mt-0.5">
                    {isAr ? (remaining === 1 ? 'مرة' : 'مرات') : (remaining === 1 ? 'time' : 'times')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {categoryDhikr.map((d, idx) => {
            const dCount = dhikrCounts[d.id] || 0;
            const dDone = dCount >= d.count;
            return (
              <button
                key={d.id}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full active-press ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-primary'
                    : dDone
                    ? 'w-2 h-2 bg-emerald-400'
                    : 'w-2 h-2 bg-border-custom hover:bg-text-secondary/50'
                }`}
                aria-label={`Go to dhikr ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
