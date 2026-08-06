import React from 'react';
import { useApp } from '../context/AppContext';
import { AyaCard } from './AyaCard';
import { HadithOfTheDay } from './HadithOfTheDay';
import { QuranProgressCard } from './QuranProgressCard';
import { StatsSection } from './StatsSection';
import { PrayerTimesCard } from './PrayerTimesCard';
import { MasbahaCard } from './MasbahaCard';
import { CATEGORIES } from '../data/adhkar';
import { getDailyTip } from '../data/dailyTips';
import { Sun, Moon, Bed, Compass, Heart, Home, DoorOpen, UtensilsCrossed, Smile, Droplets, HeartPulse, Shield, Search, Plane, Sparkles, Flame, Lightbulb, CalendarDays } from 'lucide-react';

export const HomeSection: React.FC = () => {
  const { settings, setActiveTab, setActiveCategory } = useApp();

  const isAr = settings.language === 'ar';
  const todayTip = getDailyTip();

  const getHijriDate = () => {
    try {
      return new Intl.DateTimeFormat(isAr ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return '';
    }
  };

  const handleCategoryClick = (id: string) => {
    setActiveTab('adhkar');
    setActiveCategory(id as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="h-6 w-6 text-accent-gold group-hover:animate-spin" style={{ animationDuration: '10s' }} />;
      case 'Moon': return <Moon className="h-6 w-6 text-primary" />;
      case 'Bed': return <Bed className="h-6 w-6 text-primary" />;
      case 'Compass': return <Compass className="h-6 w-6 text-primary" />;
      case 'Home': return <Home className="h-6 w-6 text-primary" />;
      case 'DoorOpen': return <DoorOpen className="h-6 w-6 text-primary" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="h-6 w-6 text-primary" />;
      case 'Mouth': return <Smile className="h-6 w-6 text-primary" />;
      case 'Droplets': return <Droplets className="h-6 w-6 text-primary" />;
      case 'HeartPulse': return <HeartPulse className="h-6 w-6 text-primary" />;
      case 'Shield': return <Shield className="h-6 w-6 text-primary" />;
      case 'Heart': return <Heart className="h-6 w-6 text-primary" />;
      case 'Search': return <Search className="h-6 w-6 text-primary" />;
      case 'Plane': return <Plane className="h-6 w-6 text-primary" />;
      case 'Sparkles': return <Sparkles className="h-6 w-6 text-primary" />;
      default: return <Compass className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="home-dashboard">

      {/* Hijri Date Header */}
      <div className="flex items-center justify-center gap-2 mb-6 text-text-secondary" id="hijri-date-header">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="arabic-text text-sm font-semibold">{getHijriDate()}</span>
      </div>

      {/* 2-Column Responsive Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start" id="home-bento-grid">
        
        {/* Right Panel (Prayer times & Tasbeeh) - Order-2 on Mobile, Order-1 on RTL Desktop */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1" id="left-sidebar-panel">
          <PrayerTimesCard />
          <MasbahaCard />
        </div>

        {/* Left Panel (Aya, Categories, Reading, Stats) - Order-1 on Mobile, Order-2 on Desktop */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8 order-1 lg:order-2" id="main-content-panel">
          
          {/* 1. Aya of the Day Banner */}
          <AyaCard />

          {/* 1.5 Hadith of the Day Banner */}
          <HadithOfTheDay />

          {/* 1.75 Streak Card */}
          {settings.adhkarStreak.count > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-6 w-6 text-orange-500 animate-bounce" />
                <h3 className="arabic-text text-xl font-bold text-orange-600">
                  {isAr ? 'سلسلتك مستمرة!' : "You're on a streak!"}
                </h3>
              </div>
              <p className="text-3xl font-black text-orange-600 mb-2">
                {settings.adhkarStreak.count}
              </p>
              <p className="arabic-text text-sm text-text-secondary">
                {isAr ? 'أيام متتالية من الالتزام' : 'consecutive days of commitment'}
              </p>
            </div>
          )}

          {/* 2. Daily Remembrance Categories */}
          <div className="flex flex-col gap-4" id="adhkar-categories-container">
            <div className="flex items-center justify-between border-b border-border-custom/50 pb-2" id="categories-header">
              <span className="arabic-text text-xs text-text-secondary font-medium">
                {isAr ? 'تصفح الأذكار والخصائص اليومية' : 'Browse daily Adhkar & features'}
              </span>
              <h2 className="arabic-text text-lg font-bold text-text-primary">
                {isAr ? 'الأذكار اليومية' : 'Daily Remembrance'}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="categories-cards-grid">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="group rounded-3xl border border-border-custom bg-surface p-5 text-right flex flex-col items-end gap-3 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-300 active-press cursor-pointer"
                  id={`cat-card-${cat.id}`}
                >
                  {/* Category icon */}
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted/50 transition-colors group-hover:bg-primary/5"
                    id={`cat-icon-wrapper-${cat.id}`}
                  >
                    {getCategoryIcon(cat.icon)}
                  </div>
                  
                  <div className="flex flex-col items-end leading-normal" id={`cat-meta-${cat.id}`}>
                    <span className="arabic-text font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                      {isAr ? cat.nameAr : cat.nameEn}
                    </span>
                    <span className="arabic-text text-[11px] font-semibold text-text-secondary mt-0.5">
                      {isAr ? cat.descriptionAr : cat.descriptionEn}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Continue Reading & Interactive Quote Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="reading-quote-row">
            
            {/* Continue Reading Quran progress */}
            <QuranProgressCard />

            {/* Daily Tip Card */}
            <div
              className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 flex flex-col justify-between h-[180px] sm:h-auto transition-all duration-300 hover:shadow-md hover:border-amber-500/30"
              id="daily-tip-card"
            >
              <div className="flex items-center gap-2 mb-3" id="daily-tip-header">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 shrink-0">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="arabic-text text-sm font-bold text-amber-700">
                  {isAr ? 'نصيحة اليوم' : 'Tip of the Day'}
                </h3>
              </div>
              <p className="arabic-text text-sm leading-relaxed text-text-primary line-clamp-4">
                {isAr ? todayTip.textAr : todayTip.textEn}
              </p>
            </div>

          </div>

          {/* 4. Bottom Row stats */}
          <StatsSection />

        </div>

      </div>

    </div>
  );
};
