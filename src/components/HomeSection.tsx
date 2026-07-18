import React from 'react';
import { useApp } from '../context/AppContext';
import { AyaCard } from './AyaCard';
import { QuranProgressCard } from './QuranProgressCard';
import { StatsSection } from './StatsSection';
import { PrayerTimesCard } from './PrayerTimesCard';
import { MasbahaCard } from './MasbahaCard';
import { CATEGORIES } from '../data/adhkar';
import { Sun, Moon, Bed, Compass, Heart } from 'lucide-react';

export const HomeSection: React.FC = () => {
  const { settings, setActiveTab, setActiveCategory } = useApp();

  const isAr = settings.language === 'ar';

  const handleCategoryClick = (id: 'morning' | 'evening' | 'sleep' | 'prayer_after') => {
    setActiveTab('adhkar');
    setActiveCategory(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="h-6 w-6 text-accent-gold group-hover:animate-spin" style={{ animationDuration: '10s' }} />;
      case 'Moon': return <Moon className="h-6 w-6 text-primary" />;
      case 'Bed': return <Bed className="h-6 w-6 text-primary" />;
      default: return <Compass className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="home-dashboard">
      
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="categories-cards-grid">
              {CATEGORIES.slice(0, 3).map((cat) => (
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

            {/* Quote Graphic Card (Inspired by Image 3) */}
            <div 
              className="relative rounded-3xl overflow-hidden shadow-sm border border-border-custom bg-primary/10 flex flex-col justify-end p-6 h-[180px] sm:h-auto"
              id="quote-illustration-card"
            >
              {/* Illustration graphic representing nature/tranquility */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/40 z-10" />
              <img 
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60&referrerpolicy=no-referrer"
                alt="Palm trees tranquility beach"
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-25"
                referrerPolicy="no-referrer"
              />
              
              <div className="relative z-20 text-right text-white" id="quote-text-container">
                <p className="arabic-text text-md sm:text-lg font-bold leading-relaxed mb-1">
                  "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ"
                </p>
                <p className="arabic-text text-[10px] font-medium text-white/80">
                  سورة الرعد - الآية ٢٨
                </p>
              </div>
            </div>

          </div>

          {/* 4. Bottom Row stats */}
          <StatsSection />

        </div>

      </div>

    </div>
  );
};
