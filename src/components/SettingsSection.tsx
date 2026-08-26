import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ensureNotificationPermission } from '../services/notify';
import { Sun, Moon, Bell, Sparkles } from 'lucide-react';

export const SettingsSection: React.FC = () => {
  const { settings, updateSettings } = useApp();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8" id="settings-section">
      
      {/* Title */}
      <div className="text-right mb-6" id="settings-title-block">
        <h1 className="arabic-text text-2xl sm:text-3xl font-black text-text-primary flex items-center justify-end gap-2">
          الإعدادات
          <Sparkles className="h-5 w-5 text-primary" />
        </h1>
        <p className="arabic-text text-xs text-text-secondary mt-1">قم بتخصيص تجربتك في تطبيق زاد</p>
      </div>

      <div className="flex flex-col gap-6" id="settings-cards-list">
        
        {/* 2. Theme Card */}
        <div className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm text-right" id="settings-theme-card">
          <div className="flex items-center justify-end gap-2 border-b border-border-custom/50 pb-3 mb-4" id="theme-header">
            <h3 className="arabic-text text-sm font-bold text-text-primary">المظهر</h3>
            {settings.theme === 'light' ? <Sun className="h-4.5 w-4.5 text-primary" /> : <Moon className="h-4.5 w-4.5 text-accent-gold" />}
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-muted/10 border border-border-custom/30" id="theme-row">
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${
                settings.theme === 'dark' ? 'bg-primary justify-end' : 'bg-text-secondary/20 justify-start'
              }`}
              id="theme-switch"
            >
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
            
            <div className="text-right" id="theme-texts">
              <span className="arabic-text font-bold text-sm block text-text-primary">الوضع الداكن</span>
              <span className="arabic-text text-[10px] font-semibold text-text-secondary mt-0.5 block">
                تغيير واجهة التطبيق للوضع الليلي المريح للعين
              </span>
            </div>
          </div>
        </div>

        {/* 3. Preferences Card */}
        <div className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm text-right" id="settings-prefs-card">
          <div className="flex items-center justify-end gap-2 border-b border-border-custom/50 pb-3 mb-4" id="prefs-header">
            <h3 className="arabic-text text-sm font-bold text-text-primary">التفضيلات</h3>
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right mb-4" id="prefs-selectors">
            
            {/* Language */}
            <div id="pref-lang">
              <label className="arabic-text text-xs font-bold text-text-primary mb-1.5 block">اللغة</label>
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as 'ar' | 'en' })}
                className="arabic-text text-xs w-full rounded-xl border border-border-custom bg-surface p-2.5 text-right focus:outline-none focus:border-primary cursor-pointer"
                id="select-lang"
              >
                <option value="ar">العربية</option>
                <option value="en">English (US)</option>
              </select>
            </div>

            {/* Font Type */}
            <div id="pref-font">
              <label className="arabic-text text-xs font-bold text-text-primary mb-1.5 block">نوع الخط</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value as 'ibmPlexSans' | 'tajawal' })}
                className="arabic-text text-xs w-full rounded-xl border border-border-custom bg-surface p-2.5 text-right focus:outline-none focus:border-primary cursor-pointer"
                id="select-font"
              >
                <option value="ibmPlexSans">IBM Plex Sans Arabic</option>
                <option value="tajawal">Tajawal (تاجاوال)</option>
              </select>
            </div>

          </div>

          {/* Font Size slider */}
          <div className="border-t border-border-custom/30 pt-4" id="font-size-slider-row">
            <div className="flex items-center justify-between mb-1" id="slider-labels">
              <span className="arabic-text text-[10px] font-bold text-text-secondary">صغير</span>
              <span className="arabic-text text-[10px] font-bold text-primary">متوسط</span>
              <span className="arabic-text text-[10px] font-bold text-text-secondary">كبير</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={settings.fontSize === 'small' ? '0' : settings.fontSize === 'medium' ? '1' : '2'}
              onChange={(e) => {
                const val = e.target.value;
                updateSettings({
                  fontSize: val === '0' ? 'small' : val === '1' ? 'medium' : 'large'
                });
              }}
              className="w-full accent-primary h-1 bg-border-custom rounded-lg appearance-none cursor-pointer"
              id="pref-font-size-slider"
            />
            <span className="arabic-text text-[10px] font-bold text-text-secondary block mt-2 text-right">حجم الخط</span>
          </div>

        </div>

        {/* 4. Notifications Card */}
        <div className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm text-right" id="settings-notif-card">
          <div className="flex items-center justify-end gap-2 border-b border-border-custom/50 pb-3 mb-4" id="notif-header">
            <h3 className="arabic-text text-sm font-bold text-text-primary">التنبيهات</h3>
            <Bell className="h-4.5 w-4.5 text-primary" />
          </div>

          <div className="flex flex-col gap-4" id="notif-switches-list">
            
            {/* Prayer times alerts */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-muted/10 border border-border-custom/30" id="notif-row-prayer">
              <button
                onClick={async () => {
                  if (!settings.prayerNotifications) {
                    const granted = await ensureNotificationPermission();
                    updateSettings({ prayerNotifications: granted });
                  } else {
                    updateSettings({ prayerNotifications: false });
                  }
                }}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${
                  settings.prayerNotifications ? 'bg-primary justify-end' : 'bg-text-secondary/20 justify-start'
                }`}
                id="switch-notif-prayer"
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </button>
              
              <div className="text-right" id="notif-texts-prayer">
                <span className="arabic-text font-bold text-sm block text-text-primary">تنبيهات مواقيت الصلاة</span>
                <span className="arabic-text text-[10px] font-semibold text-text-secondary mt-0.5 block">إشعار وتذكير عند دخول وقت كل صلاة</span>
              </div>
            </div>

            {/* Adhkar alerts */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-muted/10 border border-border-custom/30" id="notif-row-adhkar">
              <button
                onClick={() => updateSettings({ adhkarNotifications: !settings.adhkarNotifications })}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${
                  settings.adhkarNotifications ? 'bg-primary justify-end' : 'bg-text-secondary/20 justify-start'
                }`}
                id="switch-notif-adhkar"
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </button>
              
              <div className="text-right" id="notif-texts-adhkar">
                <span className="arabic-text font-bold text-sm block text-text-primary">أذكار الصباح والمساء</span>
                <span className="arabic-text text-[10px] font-semibold text-text-secondary mt-0.5 block">تذكير يومي بقراءة أذكار الصباح والمساء</span>
              </div>
            </div>

            {/* General alerts */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-muted/10 border border-border-custom/30" id="notif-row-general">
              <button
                onClick={() => updateSettings({ generalNotifications: !settings.generalNotifications })}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 ${
                  settings.generalNotifications ? 'bg-primary justify-end' : 'bg-text-secondary/20 justify-start'
                }`}
                id="switch-notif-general"
              >
                <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
              </button>
              
              <div className="text-right" id="notif-texts-general">
                <span className="arabic-text font-bold text-sm block text-text-primary">تنبيهات عامة</span>
                <span className="arabic-text text-[10px] font-semibold text-text-secondary mt-0.5 block">إشعار بأخبار وتحديثات تطبيق زاد</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
