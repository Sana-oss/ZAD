import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { hadithService, HadithFilterOptions } from '../services/HadithService';
import { Hadith, HadithGrade } from '../types';
import { useApp } from '../context/AppContext';
import { BookOpen, Search, Filter, X, Heart, User, Tag, Share2, Info, Copy, Check, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';

export const HadithSection: React.FC = () => {
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filter states
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedNarrator, setSelectedNarrator] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<HadithGrade | ''>('');
  
  const { settings, toggleFavoriteHadith, isFavoriteHadith } = useApp();
  const isAr = settings.language === 'ar';

  const books = useMemo(() => hadithService.getBooks(), []);
  const narrators = useMemo(() => hadithService.getNarrators(), []);
  const grades: HadithGrade[] = ['Sahih', 'Hasan', 'Daif', 'Unknown'];

  useEffect(() => {
    const loadHadiths = () => {
      setLoading(true);
      const options: HadithFilterOptions = {
        query: searchQuery,
        book: selectedBook,
        narrator: selectedNarrator,
        grade: selectedGrade,
      };
      
      let filtered = hadithService.searchAndFilter(options);
      
      if (viewMode === 'favorites') {
        filtered = filtered.filter(h => isFavoriteHadith(h.id));
      }
      
      setHadiths(filtered);
      setLoading(false);
    };

    const timer = setTimeout(loadHadiths, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBook, selectedNarrator, selectedGrade, viewMode, settings.favoriteHadiths]);

  // Reset currentIndex whenever filters, viewMode, or search change
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, selectedBook, selectedNarrator, selectedGrade, viewMode]);

  // Keyboard navigation (Left/Right arrows)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (hadiths.length === 0) return;
    if (e.key === 'ArrowLeft') {
      setCurrentIndex(prev => (prev + 1) % hadiths.length);
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex(prev => (prev - 1 + hadiths.length) % hadiths.length);
    }
  }, [hadiths.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getGradeColor = (grade: HadithGrade) => {
    switch (grade) {
      case 'Sahih': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'Hasan': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'Daif': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const handleShare = async (hadith: Hadith) => {
    const text = `${hadith.textAr}\n\n${hadith.textEn}\n\n${hadith.narrator} - ${hadith.book} (${hadith.reference})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hadith',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const handleCopy = async (hadith: Hadith) => {
    const text = `${hadith.textAr}\n\n${hadith.textEn}\n\nالراوي: ${hadith.narrator} | المصدر: ${hadith.book} | التخريج: ${hadith.reference}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(hadith.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Error copying', err);
    }
  };

  const activeHadith = hadiths[currentIndex];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden" id="hadith-root">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center md:text-start">
          <h1 className="arabic-text text-3xl font-black text-text-primary mb-2 flex items-center justify-center md:justify-start gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {isAr ? 'الحديث الشريف' : 'Hadith Collection'}
          </h1>
          <p className="arabic-text text-sm text-text-secondary max-w-2xl mx-auto md:mx-0">
            {isAr ? 'مجموعة من الأحاديث النبوية الشريفة الموثقة' : 'A verified collection of prophetic traditions'}
          </p>
        </div>
        
        <button 
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-surface border border-border-custom px-4 py-2 rounded-xl shadow-sm hover:border-primary/50 transition-colors text-text-primary"
        >
          <Search className="w-4 h-4" />
          <span className="font-semibold">{isAr ? 'بحث وتصفية' : 'Search & Filter'}</span>
          <Filter className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* View Mode Segmented Controls */}
      <div className="flex justify-center mb-6">
        <div className="bg-surface border border-border-custom p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setViewMode('all')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {isAr ? 'كل الأحاديث' : 'All Hadiths'}
          </button>
          <button
            onClick={() => setViewMode('favorites')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              viewMode === 'favorites'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Heart className={`w-4 h-4 ${viewMode === 'favorites' ? 'fill-current' : ''}`} />
            {isAr ? 'المفضلة' : 'Favorites'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        {loading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
           </div>
        ) : hadiths.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-3xl border border-border-custom shadow-sm flex flex-col items-center gap-3">
            {viewMode === 'favorites' ? (
              <>
                <Heart className="w-10 h-10 text-red-400 opacity-60 animate-pulse" />
                <p className="text-text-secondary font-medium">
                  {isAr ? 'لا توجد أحاديث في المفضلة بعد.' : 'No favorite Hadiths yet.'}
                </p>
                <p className="text-xs text-text-secondary max-w-xs opacity-75">
                  {isAr 
                    ? 'اضغط على أيقونة القلب على أي حديث لحفظه هنا.'
                    : 'Tap the heart icon on any Hadith to save it here.'}
                </p>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 text-text-secondary opacity-50" />
                <p className="text-text-secondary font-medium">{isAr ? 'لم يتم العثور على أحاديث تطابق بحثك.' : 'No hadiths found matching your criteria.'}</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedBook(''); setSelectedNarrator(''); setSelectedGrade(''); }}
                  className="mt-2 text-primary hover:underline font-medium text-sm"
                >
                  {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Navigation Bar */}
            <div className="flex items-center justify-between gap-4 bg-surface border border-border-custom rounded-2xl p-3 shadow-sm">
              {/* Previous Button (RTL: points right) */}
              <button
                onClick={() => setCurrentIndex(prev => (prev + 1) % hadiths.length)}
                disabled={hadiths.length <= 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                title={isAr ? 'التالي' : 'Next'}
              >
                <ChevronRight className="h-5 w-5" />
                <span className="hidden sm:inline">{isAr ? 'التالي' : 'Next'}</span>
              </button>

              {/* Counter Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary font-mono">
                  {isAr ? `[${currentIndex + 1} / ${hadiths.length}]` : `[${currentIndex + 1} / ${hadiths.length}]`}
                </span>
              </div>

              {/* Next Button (RTL: points left) */}
              <button
                onClick={() => setCurrentIndex(prev => (prev - 1 + hadiths.length) % hadiths.length)}
                disabled={hadiths.length <= 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm"
                title={isAr ? 'السابق' : 'Previous'}
              >
                <span className="hidden sm:inline">{isAr ? 'السابق' : 'Previous'}</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Single Active Hadith Card */}
            {activeHadith && (
              <div key={activeHadith.id} className="bg-surface rounded-3xl shadow-sm border border-border-custom transition-all duration-300 relative overflow-hidden flex flex-col">
                
                {/* Card Header: Book & Grade */}
                <div className="flex items-center justify-between border-b border-border-custom px-6 sm:px-8 pt-6 pb-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm tracking-wide">{activeHadith.book}</span>
                    <span className="text-xs text-text-secondary font-medium hidden sm:inline-block">[{activeHadith.reference}]</span>
                  </div>
                  {activeHadith.grade && (
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getGradeColor(activeHadith.grade)} flex items-center gap-1`}>
                      ✓ {activeHadith.grade}
                    </span>
                  )}
                </div>

                {/* Card Body - Scrollable if long */}
                <div className="px-6 sm:px-8 py-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  <div className="flex flex-col gap-6">
                    {activeHadith.textAr && (
                      <p className="quran-text text-2xl leading-loose text-right text-text-primary" dir="rtl" lang="ar">
                        {activeHadith.textAr}
                      </p>
                    )}
                    {activeHadith.textEn && (
                      <p className="font-serif text-lg leading-relaxed text-text-secondary border-l-4 border-primary/20 pl-4 py-1 italic">
                        "{activeHadith.textEn}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 pt-4 pb-6 border-t border-border-custom">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary font-medium">
                    {/* Narrator */}
                    <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg border border-border-custom">
                      <User className="w-4 h-4 text-primary" />
                      <span>{activeHadith.narrator}</span>
                    </div>
                    {/* Tags */}
                    {activeHadith.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-lg border border-border-custom">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate max-w-[120px]">{activeHadith.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Toolbar */}
                  <div className="flex items-center gap-2">
                    {/* Copy */}
                    <button 
                      onClick={() => handleCopy(activeHadith)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      title={isAr ? 'نسخ' : 'Copy'}
                    >
                      {copiedId === activeHadith.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    {/* Details / Commentary */}
                    {activeHadith.commentary && (
                      <button 
                        onClick={() => setSelectedHadith(activeHadith)}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                        title={isAr ? 'التفاصيل والشرح' : 'Details & Commentary'}
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    )}
                    {/* Share */}
                    <button 
                      onClick={() => handleShare(activeHadith)}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      title={isAr ? 'مشاركة' : 'Share'}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    {/* Favorite */}
                    <button 
                      onClick={() => toggleFavoriteHadith(activeHadith.id)}
                      className={`p-2 rounded-full transition-all duration-300 active:scale-90 ${isFavoriteHadith(activeHadith.id) ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'}`}
                      title={isAr ? 'المفضلة' : 'Favorite'}
                    >
                      <Heart className={`w-5 h-5 transition-transform ${isFavoriteHadith(activeHadith.id) ? 'fill-current transform scale-110' : ''}`} />
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Keyboard hint */}
            <div className="text-center text-xs text-text-secondary/70">
              {isAr ? 'استخدم الأسهم ← → للتنقل بين الأحاديث' : 'Use ← → arrow keys to navigate'}
            </div>
          </>
        )}
      </div>

      {/* Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Search & Filter Drawer */}
      <div 
        className={`fixed top-0 ${isAr ? 'left-0' : 'right-0'} h-full w-full sm:w-80 bg-surface shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-${isAr ? 'r' : 'l'} border-border-custom flex flex-col ${
          drawerOpen ? 'translate-x-0' : (isAr ? '-translate-x-full' : 'translate-x-full')
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-custom">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            {isAr ? 'بحث وتصفية' : 'Search & Filter'}
          </h2>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-border-custom text-text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          {/* Text Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">{isAr ? 'كلمة البحث' : 'Keyword Search'}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث في الأحاديث...' : 'Search hadiths...'}
                className="w-full bg-background border border-border-custom rounded-xl py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Book Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">{isAr ? 'الكتاب' : 'Book'}</label>
            <select 
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full bg-background border border-border-custom rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary appearance-none"
            >
              <option value="">{isAr ? 'جميع الكتب' : 'All Books'}</option>
              {books.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Narrator Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">{isAr ? 'الراوي' : 'Narrator'}</label>
            <select 
              value={selectedNarrator}
              onChange={(e) => setSelectedNarrator(e.target.value)}
              className="w-full bg-background border border-border-custom rounded-xl p-3 text-text-primary focus:outline-none focus:border-primary appearance-none"
            >
              <option value="">{isAr ? 'جميع الرواة' : 'All Narrators'}</option>
              {narrators.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary">{isAr ? 'درجة الحديث' : 'Authenticity Grade'}</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setSelectedGrade('')}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedGrade === '' ? 'bg-primary text-white border-primary' : 'bg-background text-text-secondary border-border-custom hover:border-primary/50'}`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              {grades.map(g => (
                <button 
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedGrade === g ? 'bg-primary text-white border-primary' : 'bg-background text-text-secondary border-border-custom hover:border-primary/50'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-border-custom bg-background mt-auto">
          <button 
            onClick={() => setDrawerOpen(false)}
            className="w-full bg-primary text-white font-bold rounded-xl py-3 shadow-md hover:bg-primary-hover transition-colors"
          >
            {isAr ? 'تطبيق الفلاتر' : 'Apply Filters'}
          </button>
        </div>
      </div>
      
      {/* Hadith Details Modal */}
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
                      <User className="w-4 h-4" />
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
