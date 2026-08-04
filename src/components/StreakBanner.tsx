import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame } from 'lucide-react';

export const StreakBanner: React.FC = () => {
  const { settings } = useApp();
  const isAr = settings.language === 'ar';
  const streak = settings.adhkarStreak.count;

  if (streak === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 flex items-center justify-center gap-2 rounded-lg shadow-md mb-4">
      <Flame className="h-5 w-5 animate-bounce" />
      <span className={`font-bold text-lg ${isAr ? 'arabic-text' : ''}`}>
        {isAr ? `سلسلة: ${streak} يوم متتالي` : `Streak: ${streak} days`}
      </span>
      <Flame className="h-5 w-5 animate-bounce" />
    </div>
  );
};
