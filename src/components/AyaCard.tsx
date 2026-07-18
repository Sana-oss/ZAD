import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Share2, Copy, Check, Bookmark, Heart } from 'lucide-react';

export const AyaCard: React.FC = () => {
  const { settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const ayaText = 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ۖ';
  const surahInfo = 'سورة البقرة - الآية ١٨٦';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${ayaText}" [${surahInfo}]`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'آية اليوم من زاد',
        text: `"${ayaText}" [${surahInfo}]`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const isAr = settings.language === 'ar';

  return (
    <div 
      className="relative overflow-hidden rounded-3xl bg-[#005c55] text-white p-6 sm:p-8 text-center shadow-lg border border-white transition-transform hover:shadow-xl hover:scale-[1.005] duration-300"
      id="aya-of-the-day-card"
    >
      {/* Decorative Background Patterns */}
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Category Badge */}
      <div className="mx-auto inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold backdrop-blur-sm" id="aya-badge">
        <span className="arabic-text">آية اليوم</span>
      </div>

      {/* Verse Text */}
      <p 
        className="arabic-text my-6 text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed text-white"
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        id="aya-verse-text"
      >
        "{ayaText}"
      </p>

      {/* Surah Reference */}
      <p className="arabic-text text-sm font-medium text-white/80 mb-6" id="aya-reference">
        {surahInfo}
      </p>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-4" id="aya-actions">
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-full bg-white text-[#005c55] px-5 py-2 text-sm font-semibold shadow-md active-press transition-all hover:bg-white/95"
          id="btn-share-aya"
        >
          <Share2 className="h-4 w-4" />
          <span className="arabic-text text-xs">{shared ? 'تم النسخ للمشاركة' : 'مشاركة'}</span>
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-sm active-press transition-all hover:bg-white/15 text-white"
          id="btn-copy-aya"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
          <span className="arabic-text text-xs">{copied ? 'تم الحفظ' : 'حفظ'}</span>
        </button>

      </div>
    </div>
  );
};
