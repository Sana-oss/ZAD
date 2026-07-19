import React, { useEffect, useState } from 'react';
import { hadithService, Hadith } from '../services/HadithService';
import { useApp } from '../context/AppContext';
import { BookOpen } from 'lucide-react';

export const HadithSection: React.FC = () => {
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useApp();
  const isAr = settings.language === 'ar';

  useEffect(() => {
    const loadHadiths = async () => {
      try {
        setLoading(true);
        const data = await hadithService.getHadiths();
        setHadiths(data);
      } catch (err) {
        setError('Failed to load hadiths.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHadiths();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        <p className="text-text-secondary arabic-text">{isAr ? 'جاري تحميل الأحاديث...' : 'Loading Hadiths...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-xl shadow-sm hover:bg-primary-hover"
        >
          {isAr ? 'إعادة المحاولة' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8" id="hadith-root">
      <div className="text-center mb-8">
        <h1 className="arabic-text text-3xl font-black text-text-primary mb-2 flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          {isAr ? 'الحديث الشريف' : 'Hadith Collection'}
        </h1>
        <p className="arabic-text text-sm text-text-secondary max-w-2xl mx-auto">
          {isAr ? 'مجموعة من الأحاديث النبوية الشريفة' : 'A collection of prophetic traditions'}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {hadiths.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-3xl border border-border-custom shadow-sm">
            <p className="text-text-secondary">{isAr ? 'لم يتم العثور على أحاديث.' : 'No hadiths found.'}</p>
          </div>
        ) : (
          hadiths.map((hadith) => (
            <div key={hadith.id} className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-border-custom hover:border-primary/30 transition-colors">
              
              <div className="flex items-start justify-between border-b border-border-custom pb-4 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{hadith.book}</span>
                  <span className="text-sm font-semibold text-text-secondary arabic-text">{hadith.narrator}</span>
                </div>
                {hadith.grade && hadith.grade !== 'Unknown' && (
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                    {hadith.grade}
                  </span>
                )}
              </div>

              <p className="quran-text text-xl leading-relaxed text-right text-text-primary" dir="rtl" lang="ar">
                {hadith.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
