import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Search, BookOpen, Compass, Settings, Home, Book } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, settings, updateSettings, setActiveCategory } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
    { id: 'hadith', labelAr: 'الحديث', labelEn: 'Hadith', icon: BookOpen },
    { id: 'prayer', labelAr: 'مواقيت الصلاة', labelEn: 'Prayer Times', icon: Compass },
    { id: 'quran', labelAr: 'القرآن', labelEn: 'Quran', icon: BookOpen },
    { id: 'adhkar', labelAr: 'الأذكار', labelEn: 'Adhkar', icon: Book },
    { id: 'home', labelAr: 'الرئيسية', labelEn: 'Home', icon: Home },
  ] as const;

  const isAr = settings.language === 'ar';

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setActiveCategory(null); // Reset deep linked category
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-surface/95 backdrop-blur-md transition-colors duration-200" id="desktop-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left Actions (Profile & Quick Search & Dark Mode) */}
          <div className="flex items-center gap-4" id="header-left-actions">
            <button
              onClick={() => handleTabChange('settings')}
              className="relative h-8 w-8 overflow-hidden rounded-full border border-border-custom bg-surface-muted transition-transform hover:scale-105 active:scale-95"
              aria-label="Profile Settings"
              id="btn-profile"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60&referrerpolicy=no-referrer"
                alt="Profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
            
            <button
              onClick={() => {
                updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
              }}
              className="rounded-full p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all active:scale-95"
              aria-label="Toggle Theme"
              id="btn-theme-toggle"
            >
              {settings.theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-accent-gold" />}
            </button>
            
            <button
              onClick={() => handleTabChange('adhkar')}
              className="rounded-full p-2 text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-all active:scale-95 md:flex hidden"
              aria-label="Search Adhkar"
              id="btn-search-trigger"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Right Navigation & Logo */}
          <div className="flex items-center gap-8" id="header-right-nav">
            <nav className="hidden md:flex items-center gap-6" id="desktop-nav">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`relative py-2 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}
                    id={`nav-link-${item.id}`}
                  >
                    {isAr ? item.labelAr : item.labelEn}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full transition-all" id={`nav-active-bar-${item.id}`} />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Brand Logo */}
            <button
              onClick={() => handleTabChange('home')}
              className="flex items-center gap-2 group focus:outline-none"
              id="brand-logo-btn"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform group-hover:scale-105 active:scale-95" id="brand-badge">
                <span className="arabic-text font-bold text-lg select-none">ز</span>
              </div>
              <div className="flex flex-col items-end leading-none" id="brand-text">
                <span className="font-bold tracking-wider text-xl text-primary font-sans select-none">ZAD</span>
                <span className="arabic-text text-xs text-text-secondary font-medium select-none">زاد المعرفة</span>
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-40 md:hidden flex h-16 w-full border-t border-border-custom bg-surface/95 backdrop-blur-md pb-safe" id="mobile-bottom-nav">
        <div className="flex w-full items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${
                  isActive ? 'text-primary' : 'text-text-secondary'
                }`}
                id={`mobile-nav-btn-${item.id}`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium arabic-text">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
