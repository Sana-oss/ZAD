import React, { useState, useEffect } from 'react';
import { hadithService } from '../services/HadithService';
import { Hadith } from '../types';
import { useApp } from '../context/AppContext';
import { BookOpen, Heart, Share2, ArrowLeft, ArrowRight, Sparkles, Info, X } from 'lucide-react';

export const HadithOfTheDay: React.FC = () => {
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const { settings, toggleFavoriteHadith, isFavoriteHadith, setActiveTab } = useApp();
  const isAr = settings.language === 'ar';

  useEffect(() => {
    const todayHadith = hadithService.getHadithOfTheDay();
    setHadith(todayHadith);
  }, []);

  if (!hadith) return null;

  const isFav = isFavoriteHadith(hadith.id);

  const handleShare = async () => {
    const text = `${hadith.textAr}\n\n${hadith.textEn}\n\n${hadith.narrator} - ${hadith.book} (${hadith.reference})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hadith of the Day',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-surface to-background border border-primary/20 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm tracking-wide">
            {isAr ? 'حديث اليوم' : 'Hadith of the Day'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hadith.commentary && (
            <button
              onClick={() => setSelectedHadith(hadith)}
              className="p-2 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
              title={isAr ? 'التفاصيل والشرح' : 'Details & Commentary'}
            >
              <Info className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleShare}
            className="p-2 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-full transition-all active:scale-90"
            title={isAr ? 'مشاركة' : 'Share'}
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleFavoriteHadith(hadith.id)}
            className={`p-2 rounded-full transition-all duration-300 active:scale-90 ${isFav ? 'text-red-500 bg-red-500/10' : 'text-primary/70 hover:text-red-500 hover:bg-red-500/10'}`}
            title={isAr ? 'المفضلة' : 'Favorite'}
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-current transform scale-110' : ''} transition-transform`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 relative z-10">
        {hadith.textAr && (
          <p className="quran-text text-xl leading-loose text-right text-text-primary" dir="rtl" lang="ar">
            {hadith.textAr}
          </p>
        )}

        {hadith.textEn && (
          <p className="font-serif text-base leading-relaxed text-text-secondary border-l-4 border-primary/30 pl-4 py-1 italic">
            "{hadith.textEn}"
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 pt-4 border-t border-primary/10 relative z-10 gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <span className="bg-background/80 px-2.5 py-1 rounded-md border border-border-custom">{hadith.narrator}</span>
          <span className="bg-background/80 px-2.5 py-1 rounded-md border border-border-custom truncate max-w-[150px]">{hadith.book}</span>
        </div>

        <button
          onClick={() => setActiveTab('hadith')}
          className="flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors group"
        >
          {isAr ? 'تصفح كل الأحاديث' : 'View all Hadiths'}
          {isAr ? (
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          ) : (
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </div>

      {/* Details Modal */}
      {selectedHadith && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-custom bg-background">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {isAr ? 'التفاصيل والشرح' : 'Details & Commentary'}
              </h3>
              <button
                onClick={() => setSelectedHadith(null)}
                className="p-2 rounded-full hover:bg-border-custom text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-8 custom-scrollbar">

              {/* Narrator & Book Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedHadith.narratorProfile && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {isAr ? 'الراوي' : 'Narrator Profile'}
                    </h4>
                    <div className="space-y-2 text-sm text-text-secondary">
                      <p><span className="font-semibold text-text-primary">{isAr ? 'الاسم:' : 'Name:'}</span> {selectedHadith.narratorProfile.fullName}</p>
                      <p><span className="font-semibold text-text-primary">{isAr ? 'عدد الأحاديث:' : 'Narrations:'}</span> {selectedHadith.narratorProfile.totalNarrations}</p>
                      <p><span className="font-semibold text-text-primary">{isAr ? 'سنة الوفاة:' : 'Died:'}</span> {selectedHadith.narratorProfile.deathYear}</p>
                    </div>
                  </div>
                )}

                {selectedHadith.bookMetadata && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                    <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {isAr ? 'الكتاب' : 'Book Metadata'}
                    </h4>
                    <div className="space-y-2 text-sm text-text-secondary">
                      <p><span className="font-semibold text-text-primary">{isAr ? 'المؤلف:' : 'Author:'}</span> {selectedHadith.bookMetadata.author}</p>
                      <p><span className="font-semibold text-text-primary">{isAr ? 'عدد الأحاديث:' : 'Total Hadiths:'}</span> {selectedHadith.bookMetadata.totalCount}</p>
                      <p><span className="font-semibold text-text-primary">{isAr ? 'التوثيق:' : 'Authenticity:'}</span> {selectedHadith.bookMetadata.authenticityNotes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Commentary Section */}
              {selectedHadith.commentary && (
                <div className="flex flex-col gap-6">

                  {/* Complex Terms */}
                  {Object.keys(selectedHadith.commentary.complexTerms).length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-text-primary mb-3 border-b border-border-custom pb-2">
                        {isAr ? 'شرح المفردات' : 'Complex Terms'}
                      </h4>
                      <ul className="space-y-2">
                        {Object.entries(selectedHadith.commentary.complexTerms).map(([term, meaning]) => (
                          <li key={term} className="text-sm text-text-secondary flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="font-bold text-primary arabic-text bg-primary/10 px-2 py-0.5 rounded shrink-0">{term}</span>
                            <span>{meaning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Lessons */}
                  {selectedHadith.commentary.keyLessons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-text-primary mb-3 border-b border-border-custom pb-2">
                        {isAr ? 'الفوائد المستنبطة' : 'Key Lessons'}
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-text-secondary marker:text-primary">
                        {selectedHadith.commentary.keyLessons.map((lesson, idx) => (
                          <li key={idx}>{lesson}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Practical Applications */}
                  {selectedHadith.commentary.practicalApplications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-text-primary mb-3 border-b border-border-custom pb-2">
                        {isAr ? 'التطبيقات العملية' : 'Practical Applications'}
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-text-secondary marker:text-primary">
                        {selectedHadith.commentary.practicalApplications.map((app, idx) => (
                          <li key={idx}>{app}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-border-custom bg-background mt-auto flex justify-end">
              <button
                onClick={() => setSelectedHadith(null)}
                className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-hover transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
