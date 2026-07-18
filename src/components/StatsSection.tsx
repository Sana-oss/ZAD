import React from 'react';
import { useApp } from '../context/AppContext';

export const StatsSection: React.FC = () => {
  const { settings } = useApp();

  const stats = [
    { value: '1.2k', labelAr: 'أجر ومشاركة', labelEn: 'Rewards & Shares' },
    { value: '٨', labelAr: 'ختمات منجزة', labelEn: 'Completed Khatmas' },
    { value: '٤٥٠', labelAr: 'تسبيحة اليوم', labelEn: 'Today\'s Tasbeehs' },
    { value: '١٢', labelAr: 'يوم متتالي', labelEn: 'Day Streak' },
  ];

  const isAr = settings.language === 'ar';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full" id="stats-grid">
      {stats.map((stat, idx) => (
        <div 
          key={idx}
          className="rounded-2xl border border-border-custom bg-surface p-4 text-center shadow-sm transition-transform hover:scale-[1.01] hover:shadow-md duration-300"
          id={`stat-card-${idx}`}
        >
          <p className="arabic-text font-sans text-2xl font-extrabold text-primary mb-1">
            {stat.value}
          </p>
          <p className="arabic-text text-xs font-semibold text-text-secondary">
            {isAr ? stat.labelAr : stat.labelEn}
          </p>
        </div>
      ))}
    </div>
  );
};
