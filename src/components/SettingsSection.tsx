import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Lock, Eye, EyeOff, Check, LogOut, Sun, Moon, Bell, Sparkles } from 'lucide-react';

export const SettingsSection: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passChanged, setPassChanged] = useState(false);

  const isAr = settings.language === 'ar';

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert(isAr ? 'كلمات المرور الجديدة غير متطابقة!' : 'New passwords do not match!');
      return;
    }
    setPassChanged(true);
    setPasswords({ old: '', new: '', confirm: '' });
    setTimeout(() => {
      setPassChanged(false);
      setShowPasswordFields(false);
    }, 2000);
  };

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
        
        {/* 1. Account Settings Card */}
        <div className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm text-right" id="settings-account-card">
          <div className="flex items-center justify-end gap-2 border-b border-border-custom/50 pb-3 mb-4" id="account-header">
            <h3 className="arabic-text text-sm font-bold text-text-primary">الحساب</h3>
            <User className="h-4.5 w-4.5 text-primary" />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-muted/30 border border-border-custom/30" id="account-info">
            <span className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors text-xs font-semibold font-sans">
              ‹
            </span>
            <div className="flex items-center gap-3 text-right" id="account-meta">
              <div className="leading-tight" id="account-texts">
                <span className="arabic-text font-bold text-sm block text-text-primary">عبدالرحمن محمد</span>
                <span className="font-sans text-xs text-text-secondary block">abdurrahman@example.com</span>
              </div>
              <div className="h-11 w-11 rounded-full overflow-hidden border border-border-custom" id="account-avatar">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60&referrerpolicy=no-referrer"
                  alt="Profile"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Password fields block */}
          <div className="mt-4" id="password-block">
            <button
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center justify-end gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors py-1.5 px-3 rounded-full hover:bg-surface-muted ml-auto active-press"
              id="btn-toggle-password-change"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="arabic-text">تغيير كلمة المرور</span>
            </button>

            {showPasswordFields && (
              <form onSubmit={handlePasswordChange} className="mt-4 flex flex-col gap-3 rounded-2xl p-4 bg-surface-muted/30 border border-border-custom/30" id="password-form">
                <div className="text-right" id="pass-field-old">
                  <label className="arabic-text text-[10px] font-semibold text-text-secondary mb-1 block">كلمة المرور الحالية</label>
                  <input
                    type="password"
                    required
                    value={passwords.old}
                    onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                    className="arabic-text text-xs w-full rounded-xl border border-border-custom bg-surface p-2.5 text-right focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right" id="pass-fields-new">
                  <div id="pass-field-confirm">
                    <label className="arabic-text text-[10px] font-semibold text-text-secondary mb-1 block">تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      required
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="arabic-text text-xs w-full rounded-xl border border-border-custom bg-surface p-2.5 text-right focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div id="pass-field-new">
                    <label className="arabic-text text-[10px] font-semibold text-text-secondary mb-1 block">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      required
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="arabic-text text-xs w-full rounded-xl border border-border-custom bg-surface p-2.5 text-right focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 rounded-xl bg-primary text-white text-xs font-bold py-2.5 px-4 shadow-sm hover:bg-primary-hover active-press transition-colors self-start arabic-text"
                >
                  {passChanged ? 'تم التحديث!' : 'حفظ التحديث'}
                </button>
              </form>
            )}
          </div>
        </div>

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
                onClick={() => updateSettings({ prayerNotifications: !settings.prayerNotifications })}
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
                <span className="arabic-text text-[10px] font-semibold text-text-secondary mt-0.5 block">تذكير يومي بقراءة أذكار الصباح والمساء والورد اليومي</span>
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
                <span className="arabic-text text-[10px] font-semibold text-text-secondary mt-0.5 block">أخبار تطبيق زاد والتحديثات والمميزات الجديدة</span>
              </div>
            </div>

          </div>
        </div>

        {/* 5. Logout Button (Inspired by Image 4) */}
        <button
          onClick={() => {
            if (window.confirm(isAr ? 'هل تود تسجيل الخروج من حسابك؟' : 'Are you sure you want to log out?')) {
              alert(isAr ? 'تم تسجيل الخروج بنجاح.' : 'Logged out successfully.');
            }
          }}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-sm font-bold p-4 shadow-sm active-press transition-colors cursor-pointer"
          id="btn-logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="arabic-text">تسجيل الخروج</span>
        </button>

      </div>

    </div>
  );
};
