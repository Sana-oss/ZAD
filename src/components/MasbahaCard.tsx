import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, Sparkles } from 'lucide-react';

export const MasbahaCard: React.FC = () => {
  const { settings, updateSettings, incrementMasbaha, resetMasbaha, changeMasbahaPhrase } = useApp();
  const [isTapped, setIsTapped] = useState(false);

  const phrases = [
    'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  ];

  const handleTap = () => {
    setIsTapped(true);
    incrementMasbaha();
    setTimeout(() => setIsTapped(false), 150);
  };

  const isAr = settings.language === 'ar';

  return (
    <div 
      className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm transition-colors duration-200 flex flex-col items-center justify-between text-center relative overflow-hidden h-[420px] max-w-sm mx-auto"
      id="masbaha-card"
    >
      {/* Card Header */}
      <div className="w-full flex items-center justify-between border-b border-border-custom/50 pb-3 mb-4" id="masbaha-header">
        <Sparkles className="h-5 w-5 text-accent-gold" />
        <h3 className="arabic-text text-md font-bold text-text-primary">
          {isAr ? 'المسبحة الإلكترونية' : 'Digital Masbaha'}
        </h3>
      </div>

      {/* Counter Circle */}
      <div className="relative flex items-center justify-center h-32 w-32" id="masbaha-counter-wrapper">
        {/* Animated Progress Ring */}
        <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            className="stroke-border-custom fill-none"
            strokeWidth="4"
          />
          <circle
            cx="64"
            cy="64"
            r="58"
            className="stroke-primary fill-none transition-all duration-300"
            strokeWidth="5"
            strokeDasharray={2 * Math.PI * 58}
            strokeDashoffset={(2 * Math.PI * 58) * (1 - (settings.masbahaCount % 33) / 33)}
            strokeLinecap="round"
          />
        </svg>
        <span 
          className="font-sans text-4xl font-extrabold text-primary tracking-tight select-none"
          id="masbaha-count-value"
        >
          {settings.masbahaCount}
        </span>
      </div>

      {/* Phrase Selector / Text Display */}
      <div className="w-full px-2" id="masbaha-phrase-box">
        <select
          value={settings.masbahaPhrase}
          onChange={(e) => changeMasbahaPhrase(e.target.value)}
          className="arabic-text w-full text-center text-sm font-semibold text-primary bg-surface-muted/50 py-2 px-3 rounded-2xl border border-border-custom/30 focus:outline-none cursor-pointer transition-colors hover:bg-surface-muted"
          id="masbaha-phrase-dropdown"
        >
          {phrases.map((phrase, idx) => (
            <option key={idx} value={phrase} className="arabic-text text-sm">
              {phrase}
            </option>
          ))}
        </select>
      </div>

      {/* Large Click Button */}
      <button
        onClick={handleTap}
        className={`relative h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transition-all duration-150 active-press hover:bg-primary-hover active:scale-90 ${
          isTapped ? 'scale-95 bg-primary-hover' : 'scale-100'
        }`}
        aria-label="Tap to count"
        id="masbaha-click-btn"
      >
        <span className="absolute h-full w-full rounded-full bg-primary/25 animate-ping opacity-25 pointer-events-none" />
        <svg
          className="h-8 w-8 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      </button>

      {/* Reset Controls */}
      <button
        onClick={resetMasbaha}
        className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-red-500 transition-colors py-1 px-3 rounded-full hover:bg-red-50/50 dark:hover:bg-red-950/20 active-press"
        id="masbaha-reset-btn"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="arabic-text">{isAr ? 'إعادة ضبط' : 'Reset'}</span>
      </button>

    </div>
  );
};
