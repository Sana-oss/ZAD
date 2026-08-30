import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { settings, setActiveTab } = useApp();

  const isAr = settings.language === 'ar';

  const handleLinkClick = (tab: 'home' | 'adhkar' | 'quran' | 'prayer' | 'settings', e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full border-t border-border-custom bg-surface py-6 sm:py-8 mt-12 transition-colors duration-200" id="app-footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left Side (RTL: Right side): Quick static informational links */}
        <div className="flex items-center gap-6 order-2 sm:order-1" id="footer-links">
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); alert(isAr ? 'بريد الدعم والمقترحات: ssanaf02@gmail.com' : 'Support email: ssanaf02@gmail.com'); }}
            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors arabic-text"
            id="link-contact"
          >
            {isAr ? 'اتصل بنا' : 'Contact Us'}
          </a>
          <a
            href="#terms"
            onClick={(e) => { e.preventDefault(); alert(isAr ? 'شروط الخدمة: تطبيق زاد هو منصة مجانية بالكامل وقف لله تعالى لخدمة المسلمين.' : 'Terms of Service: Zad is 100% free.'); }}
            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors arabic-text"
            id="link-terms"
          >
            {isAr ? 'شروط الخدمة' : 'Terms of Service'}
          </a>
          <a
            href="#privacy"
            onClick={(e) => { e.preventDefault(); alert(isAr ? 'سياسة الخصوصية: لا نقوم بجمع أي بيانات شخصية، يتم حفظ جميع التفضيلات والعدادات محلياً على جهازك.' : 'Privacy Policy: We do not collect data.'); }}
            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors arabic-text"
            id="link-privacy"
          >
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </a>
          <a
            href="#android-app"
            onClick={(e) => { e.preventDefault(); handleLinkClick('settings', e); }}
            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors arabic-text"
            id="link-android-app"
          >
            {isAr ? 'تطبيق أندرويد' : 'Android App'}
          </a>
        </div>

        {/* Right Side (RTL: Left side): Brand & copyright */}
        <div className="flex flex-col sm:items-end items-center gap-1 order-1 sm:order-2 text-center sm:text-right" id="footer-brand">
          <div className="flex items-center gap-1.5" id="footer-brand-logo">
            <span className="font-extrabold tracking-wider text-primary text-sm font-sans select-none">ZAD</span>
            <span className="arabic-text text-sm font-bold text-text-primary select-none">زاد</span>
          </div>
          <p className="arabic-text text-[10px] text-text-secondary font-medium" id="footer-copyright">
            {isAr ? '© 2026 زاد. جميع الحقوق محفوظة.' : '© 2026 ZAD. All rights reserved.'}
          </p>
        </div>

      </div>
    </footer>
  );
};
