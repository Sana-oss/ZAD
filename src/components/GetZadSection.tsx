import React from 'react';
import { Smartphone, Globe, Download, BellRing, Info, Chrome, Apple } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ANDROID_APK_URL, APP_VERSION, WEB_APP_URL } from '../config/release';

/**
 * "Get ZAD" — distribution section (Web/PWA + Android APK).
 * Purely additive UI; uses the existing ZAD design tokens and i18n pattern.
 */
export const GetZadSection: React.FC = () => {
  const { settings } = useApp();
  const isAr = settings.language === 'ar';

  const steps: string[] = isAr
    ? [
        'اضغط زر «حمّل زاد لأندرويد» في الأعلى.',
        'افتح الملف الذي تم تنزيله.',
        'إذا سألك أندرويد عن السماح بالتثبيت من هذا المصدر، اسمح بذلك.',
        'ثبّت التطبيق ثم افتحه.',
        'اسمح بإذن الموقع لعرض مواقيت الصلاة بدقة.',
        'اسمح بإذن الإشعارات لتفعيل تنبيهات مواقيت الصلاة.',
      ]
    : [
        'Tap "Download ZAD for Android" above.',
        'Open the downloaded file.',
        'If Android asks for permission to install from this source, allow it.',
        'Install ZAD, then open it.',
        'Allow the location permission for accurate prayer times.',
        'Allow the notification permission to enable prayer notifications.',
      ];

  return (
    <div className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm text-right" id="getzad-card">
      {/* Header */}
      <div className="flex items-center justify-end gap-2 border-b border-border-custom/50 pb-3 mb-4" id="getzad-header">
        <h3 className="arabic-text text-sm font-bold text-text-primary">
          {isAr ? 'الحصول على زاد' : 'Get ZAD'}
        </h3>
        <Smartphone className="h-4.5 w-4.5 text-primary" />
      </div>
      {/* ── Option 1: Web / PWA ── */}
      <div className="p-3 rounded-2xl bg-surface-muted/10 border border-border-custom/30 mb-3" id="getzad-web-block">
        <div className="flex items-center justify-end gap-2 mb-1" id="getzad-web-title">
          <span className="arabic-text font-bold text-sm text-text-primary">
            {isAr ? 'نسخة الويب / PWA' : 'Web / PWA'}
          </span>
          <Globe className="w-4 h-4 text-primary" />
        </div>
        <p className="arabic-text text-[10px] font-semibold text-text-secondary mb-3" id="getzad-web-desc">
          {isAr
            ? 'استخدم زاد مباشرة في متصفحك، أو ثبّته كتطبيق على شاشتك الرئيسية.'
            : 'Use ZAD directly in your browser, or install it to your home screen.'}
        </p>
        <a
          href={WEB_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center w-full arabic-text text-sm font-bold bg-primary text-white rounded-2xl py-3 cursor-pointer hover:opacity-90 transition-opacity"
          id="btn-open-zad-web"
        >
          {isAr ? 'افتح زاد' : 'Open ZAD'}
        </a>
      </div>

      {/* ── Option 2: Android APK ── */}
      <div className="p-3 rounded-2xl bg-surface-muted/10 border border-primary/30 mb-3" id="getzad-android-block">
        <div className="flex items-center justify-end gap-2 mb-1" id="getzad-android-title">
          <span className="arabic-text font-bold text-sm text-text-primary">
            {isAr ? 'تطبيق أندرويد' : 'Android App'}
          </span>
          <Smartphone className="w-4 h-4 text-primary" />
        </div>
        <p className="arabic-text text-[10px] font-semibold text-text-secondary mb-1" id="getzad-android-desc">
          {isAr ? 'احصل على التجربة الكاملة.' : 'Get the full Android experience.'}
        </p>
        <p className="arabic-text text-[10px] font-semibold text-primary mb-3 flex items-center justify-end gap-1" id="getzad-android-notif-note">
          {isAr
            ? 'يتضمن تنبيهات صلاة أصلية تعمل حتى عندما يكون التطبيق مغلقًا.'
            : 'Includes native prayer notifications that work even when ZAD is closed.'}
          <BellRing className="w-3.5 h-3.5 shrink-0" />
        </p>
        <a
          href={ANDROID_APK_URL}
          download
          className="block text-center w-full arabic-text text-sm font-bold bg-primary text-white rounded-2xl py-3 cursor-pointer hover:opacity-90 transition-opacity"
          id="btn-download-zad-android"
        >
          {isAr ? 'حمّل زاد لأندرويد' : 'Download ZAD for Android'}
        </a>
        <p className="arabic-text text-[10px] font-semibold text-text-secondary mt-2 text-center" id="getzad-android-version">
          {isAr ? `الإصدار ${APP_VERSION} • مجاني 100%` : `Version ${APP_VERSION} • 100% free`}
        </p>

        {/* Installation guide */}
        <div className="mt-4 pt-3 border-t border-border-custom/50" id="getzad-install-guide">
          <p className="arabic-text text-xs font-bold text-text-primary mb-2" id="getzad-install-title">
            {isAr ? 'خطوات التثبيت:' : 'Installation steps:'}
          </p>
          <ol className="list-decimal pe-4 space-y-1" id="getzad-install-steps">
            {steps.map((step, i) => (
              <li key={i} className="arabic-text text-[11px] font-semibold text-text-secondary">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── APK vs PWA distinction + PWA install hint ── */}
      <div className="p-3 rounded-2xl bg-surface-muted/10 border border-border-custom/30" id="getzad-pwa-note">
        <div className="flex items-start justify-end gap-2" id="getzad-distinction">
          <Info className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
          <p className="arabic-text text-[10px] font-semibold text-text-secondary leading-relaxed">
            {isAr ? (
              <>
                <span className="font-bold text-text-primary">ما الفرق؟</span> تطبيق أندرويد يوفّر تنبيهات
                الصلاة الأصلية التي تعمل حتى عندما يكون زاد مغلقًا تمامًا، بينما نسخة الويب/PWA تجربة تعمل
                عبر المتصفح. لتثبيت نسخة الويب: في Chrome على أندرويد اختر «إضافة إلى الشاشة الرئيسية»،
                وفي Safari على آيفون اختر «مشاركة» ثم «إضافة إلى الشاشة الرئيسية».
              </>
            ) : (
              <>
                <span className="font-bold text-text-primary">What is the difference?</span> The Android app
                provides native prayer notifications that work even when ZAD is completely closed, while the
                Web/PWA version is a browser-based experience. To install the web version: in Chrome on
                Android choose "Add to Home screen", and in Safari on iOS choose "Share" then "Add to Home
                Screen".
              </>
            )}
          </p>
        </div>
        <div className="flex items-center justify-end gap-4 mt-2" id="getzad-pwa-browsers">
          <span className="flex items-center gap-1 arabic-text text-[10px] font-semibold text-text-secondary">
            {isAr ? 'كروم' : 'Chrome'} <Chrome className="w-3 h-3" />
          </span>
          <span className="flex items-center gap-1 arabic-text text-[10px] font-semibold text-text-secondary">
            {isAr ? 'سفاري' : 'Safari'} <Apple className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
