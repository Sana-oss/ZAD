import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, Bell, BellOff, Compass, Settings } from 'lucide-react';

export const PrayerTimesCard: React.FC = () => {
  const { settings } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifStates, setNotifStates] = useState<Record<string, boolean>>({
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  });

  const [dst, setDst] = useState(false);

  // Sync current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerData = [
    { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', time: '04:32', type: 'AM' },
    { id: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', time: '06:12', type: 'AM' },
    { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', time: '12:05', type: 'PM' },
    { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', time: '15:38', displayTime: '03:38', type: 'PM' },
    { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', time: '18:45', displayTime: '06:45', type: 'PM' },
    { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', time: '20:12', displayTime: '08:12', type: 'PM' },
  ];

  const toggleNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to convert hh:mm to milliseconds from start of day
  const timeToMs = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60 + m) * 60 * 1000;
  };

  // Find next prayer and calculate countdown
  const getNextPrayer = () => {
    const currentMs = (currentTime.getHours() * 60 + currentTime.getMinutes()) * 60 * 1000 + currentTime.getSeconds() * 1000;
    
    // Sort prayers chronologically
    let next = prayerData.find((p) => timeToMs(p.time) > currentMs);
    let isNextDay = false;
    
    if (!next) {
      next = prayerData[0]; // Fajr tomorrow
      isNextDay = true;
    }

    const nextMs = timeToMs(next.time);
    let diff = nextMs - currentMs;
    if (isNextDay) {
      diff += 24 * 60 * 60 * 1000; // Add full day
    }

    // Format diff
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num: number) => String(num).padStart(2, '0');
    return {
      prayer: next,
      countdown: `${pad(hours)}:${pad(mins)}:${pad(secs)}`,
      id: next.id,
    };
  };

  const nextPrayerInfo = getNextPrayer();
  const isAr = settings.language === 'ar';

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto" id="prayer-qibla-section">
      
      {/* Prayer Times Panel */}
      <div 
        className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm transition-colors duration-200"
        id="prayer-times-panel"
      >
        {/* Title */}
        <div className="flex items-center justify-between border-b border-border-custom/50 pb-4 mb-5" id="prayer-header">
          <div className="flex items-center gap-1.5 text-text-secondary text-xs font-semibold" id="prayer-location">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="arabic-text">الرياض، المملكة العربية السعودية</span>
          </div>
          <div className="flex items-center gap-2" id="prayer-main-title">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="arabic-text text-md font-bold text-text-primary">مواقيت الصلاة</h3>
          </div>
        </div>

        {/* Dynamic Countdown Header */}
        <div 
          className="mb-6 rounded-2xl bg-primary/5 border border-primary/10 p-4 text-center"
          id="prayer-countdown-banner"
        >
          <p className="arabic-text text-xs text-text-secondary font-medium mb-1">
            {isAr ? `الصلاة القادمة: ${nextPrayerInfo.prayer.nameAr}` : `Next Prayer: ${nextPrayerInfo.prayer.nameEn}`}
          </p>
          <p className="font-sans text-3xl font-extrabold text-primary tracking-wider" id="countdown-timer">
            {nextPrayerInfo.countdown}
          </p>
          <span className="arabic-text text-[10px] text-text-secondary font-medium">
            {isAr ? 'الوقت المتبقي لإقامة الصلاة' : 'Remaining time to prayer'}
          </span>
        </div>

        {/* Prayer List */}
        <div className="flex flex-col gap-2.5" id="prayer-items-list">
          {prayerData.map((p) => {
            const isNext = nextPrayerInfo.id === p.id;
            const isNotifOn = notifStates[p.id];
            
            // Format time display
            const displayTime = p.displayTime || p.time;
            const arSuffix = p.type === 'AM' ? 'ص' : 'م';
            const enSuffix = p.type;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                  isNext 
                    ? 'bg-primary border-primary text-white shadow-md scale-[1.01]' 
                    : 'bg-surface-muted/30 border-border-custom/40 text-text-primary hover:border-primary/20'
                }`}
                id={`prayer-row-${p.id}`}
              >
                {/* Left side: Time & Notification Toggle */}
                <div className="flex items-center gap-3" id={`prayer-left-${p.id}`}>
                  <button
                    onClick={(e) => toggleNotification(p.id, e)}
                    className={`p-1.5 rounded-full transition-colors hover:bg-white/10 ${
                      isNext 
                        ? 'text-white' 
                        : isNotifOn ? 'text-primary' : 'text-text-secondary'
                    }`}
                    aria-label={`Toggle Azan for ${p.nameEn}`}
                    id={`btn-toggle-notif-${p.id}`}
                  >
                    {isNotifOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 opacity-50" />}
                  </button>
                  <span className="font-sans font-bold text-sm tracking-wide">
                    {displayTime} <span className="arabic-text text-xs font-semibold">{isAr ? arSuffix : enSuffix}</span>
                  </span>
                </div>

                {/* Right side: Name */}
                <span className="arabic-text font-bold text-sm tracking-wide" id={`prayer-name-${p.id}`}>
                  {isAr ? p.nameAr : p.nameEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Info & Qibla Compass Map Panel */}
      <div 
        className="rounded-3xl border border-border-custom bg-surface p-6 shadow-sm transition-colors duration-200"
        id="qibla-calculation-panel"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="info-qibla-grid">
          
          {/* Calendar & Calculation Box */}
          <div className="flex flex-col justify-between p-4 rounded-2xl bg-surface-muted/40 border border-border-custom/30 text-right" id="calendar-box">
            <div>
              <span className="arabic-text text-[10px] font-semibold text-primary block mb-1">التاريخ الهجري</span>
              <p className="arabic-text text-sm font-bold text-text-primary mb-3">١٤ شعبان ١٤٤٥ هـ</p>
              
              <span className="arabic-text text-[10px] font-semibold text-primary block mb-1">طريقة الحساب</span>
              <p className="arabic-text text-xs font-semibold text-text-secondary mb-3">الهيئة العامة المصرية للمساحة</p>
            </div>
            
            <div className="flex items-center justify-between border-t border-border-custom/50 pt-3 mt-2" id="dst-toggle-row">
              <button 
                onClick={() => setDst(!dst)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 ${dst ? 'bg-primary justify-end' : 'bg-text-secondary/30 justify-start'}`}
                id="dst-toggle"
              >
                <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </button>
              <span className="arabic-text text-xs font-semibold text-text-secondary">التوقيت الصيفي</span>
            </div>
          </div>

          {/* Compass Graphic Box */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-muted/40 border border-border-custom/30 text-center" id="compass-box">
            <span className="arabic-text text-xs font-bold text-text-primary mb-2">اتجاه القبلة</span>
            
            {/* Minimal Compass UI */}
            <div className="relative h-24 w-24 flex items-center justify-center mb-2" id="compass-indicator">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20" />
              {/* Center Mecca marker */}
              <div className="absolute h-1.5 w-1.5 rounded-full bg-accent-gold" />
              {/* Hand pointer */}
              <div 
                className="absolute h-12 w-0.5 bg-primary origin-bottom" 
                style={{ transform: 'rotate(135.4deg)', bottom: '50%' }}
              />
              <Compass className="h-10 w-10 text-primary/40 animate-pulse-subtle" />
            </div>

            <p className="arabic-text text-[10px] font-semibold text-text-secondary">
              زاوية القبلة: <span className="font-sans font-bold text-primary">135.4°</span> من الشمال
            </p>

            <button
              onClick={() => alert(isAr ? 'تم تشغيل البوصلة في هاتفك لتحديد اتجاه الكعبة المشرفة بدقة.' : 'Compass active.')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary text-white text-xs font-semibold px-4 py-1.5 shadow-sm active-press transition-colors hover:bg-primary-hover"
              id="btn-open-compass"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="arabic-text text-[10px]">افتح البوصلة</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
