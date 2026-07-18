import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen } from 'lucide-react';

export const QuranProgressCard: React.FC = () => {
  const { settings, setActiveTab, setQuranSearchQuery } = useApp();

  const handleContinueReading = () => {
    // Jump to Quran tab
    setActiveTab('quran');
    // Pre-fill search or select Al-Kahf (surah number 18)
    setQuranSearchQuery('الكهف');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAr = settings.language === 'ar';

  return (
    <div 
      className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm flex items-center justify-between gap-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20"
      id="quran-progress-card"
    >
      {/* Decorative vector background */}
      <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-primary/5 rounded-l-full pointer-events-none flex items-center justify-center">
        <BookOpen className="h-16 w-16 text-primary/10" />
      </div>

      <div className="flex flex-col gap-3 w-full pr-0 sm:pr-8" id="progress-content">
        <div className="flex items-center justify-between" id="progress-header">
          <span className="font-sans font-extrabold text-sm text-primary tracking-wide">65%</span>
          <h3 className="arabic-text text-md font-bold text-text-primary">متابعة القراءة</h3>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-border-custom/50 rounded-full h-2" id="progress-bar-bg">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500" 
            style={{ width: '65%' }}
            id="progress-bar-fill"
          />
        </div>

        <p className="arabic-text text-xs font-semibold text-text-secondary leading-relaxed mt-1">
          {isAr 
            ? 'لقد توقفت عند سورة الكهف - الآية ٤٥. هل تود إكمال القراءة الآن؟' 
            : 'You stopped at Surah Al-Kahf - Verse 45. Would you like to continue reading now?'}
        </p>

        {/* Action Button */}
        <button
          onClick={handleContinueReading}
          className="mt-2 self-start flex items-center gap-2 rounded-full bg-primary text-white text-xs font-semibold px-5 py-2.5 shadow-sm active-press transition-colors hover:bg-primary-hover"
          id="btn-continue-reading"
        >
          <BookOpen className="h-4 w-4" />
          <span className="arabic-text">{isAr ? 'إكمال القراءة' : 'Continue Reading'}</span>
        </button>
      </div>
    </div>
  );
};
