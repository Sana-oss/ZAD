/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { HomeSection } from './components/HomeSection';
import { AdhkarSection } from './components/AdhkarSection';
import { QuranSection } from './components/QuranSection';
import { HadithSection } from './components/HadithSection';
import { PrayerTimesCard } from './components/PrayerTimesCard';
import { SettingsSection } from './components/SettingsSection';
import { Footer } from './components/Footer';
import { AudioPlayer } from './components/AudioPlayer';

const AppContent: React.FC = () => {
  const { activeTab, settings } = useApp();

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'home':
        return <HomeSection />;
      case 'adhkar':
        return <AdhkarSection />;
      case 'quran':
        return <QuranSection />;
      case 'hadith':
        return <HadithSection />;
      case 'prayer':
        return (
          <div className="mx-auto max-w-xl px-4 py-8" id="prayer-page-wrapper">
            <div className="text-center mb-6" id="prayer-page-title">
              <h1 className="arabic-text text-2xl sm:text-3xl font-black text-text-primary mb-2">مواقيت الصلاة</h1>
              <p className="arabic-text text-xs text-text-secondary">مواعيد دقيقة للأذان في مدينة الرياض واتجاه القبلة المشرفة</p>
            </div>
            <PrayerTimesCard />
          </div>
        );
      case 'settings':
        return <SettingsSection />;
      default:
        return <HomeSection />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-16 md:pb-0 transition-colors duration-200" id="app-shell">
      <div>
        <Navigation />
        <main className="flex-grow" id="main-content">
          {renderActiveSection()}
        </main>
      </div>
      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
