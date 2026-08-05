import React from 'react';
import { useApp } from '../context/AppContext';

export const StatsSection: React.FC = () => {
  const { settings } = useApp();

  const isAr = settings.language === 'ar';

  const today = new Date().toISOString().split('T')[0];
  const tasbeehToday = settings.misbahaStats.lastResetDate === today ? settings.misbahaStats.todayCount : 0;
  const adhkarCompletedCount = Object.values(settings.adhkarCompletedToday).filter(Boolean).length;

  const stats = [
    {
      value: `${settings.quranProgress?.progressPercentage ?? 0}%`,
      labelAr: 'تقدم القراءة الحالية',
      labelEn: 'Current Reading Progress',
    },
    {
      value: `${adhkarCompletedCount}/4`,
      labelAr: 'أذكار مكتملة اليوم',
      labelEn: "Today's Completed Adhkar",
    },
    {
      value: String(tasbeehToday),
      labelAr: 'تسبيحة اليوم',
      labelEn: "Today's Tasbeehs",
    },
    {
      value: String(settings.adhkarStreak.count),
      labelAr: 'يوم متتالي',
      labelEn: 'Day Streak',
    },
  ];

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
