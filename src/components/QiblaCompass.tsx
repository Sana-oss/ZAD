import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Compass, MapPin, Smartphone } from 'lucide-react';
import {
  calculateQibla,
  requestOrientationPermission,
  isIOSSafari,
  type OrientationPermission,
} from '../services/qiblaService';
import type { LocationCoords } from '../services/prayerTimesService';

/** Use the absolute-orientation event when available: it provides a calibrated, true-north heading
 *  (via webkitCompassHeading on iOS) instead of the uncalibrated relative alpha. */
const ORIENTATION_EVENT: string =
  typeof window !== 'undefined' && 'ondeviceorientationabsolute' in window
    ? 'deviceorientationabsolute'
    : 'deviceorientation';

interface Props {
  location: LocationCoords;
}

export const QiblaCompass: React.FC<Props> = ({ location }) => {
  const { settings } = useApp();
  const isArabic = settings.language === 'ar';

  const [heading, setHeading] = useState(0);
  const [permission, setPermission] = useState<OrientationPermission>('unavailable');
  const [needsGrant, setNeedsGrant] = useState(false);
  const animRef = useRef<number | null>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const lastUpdate = useRef(0);

  const { bearing, formatted } = calculateQibla(location.latitude, location.longitude);

  const animate = useCallback(() => {
    let target = targetRef.current;
    let current = currentRef.current;

    let diff = target - current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    current += diff * 0.15;
    current = ((current % 360) + 360) % 360;
    currentRef.current = current;

    setHeading(Math.round(current * 10) / 10);

    if (Math.abs(diff) > 0.1) {
      animRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    if (permission === 'denied') return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      const now = Date.now();
      if (now - lastUpdate.current < 50) return;
      lastUpdate.current = now;

      let h: number | null = null;

      if ('webkitCompassHeading' in e && typeof (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading === 'number') {
        h = (e as DeviceOrientationEvent & { webkitCompassHeading: number }).webkitCompassHeading;
      } else if (e.alpha !== null) {
        h = (360 - e.alpha) % 360;
      }

      if (h !== null) {
        targetRef.current = h;
        if (!animRef.current) {
          animRef.current = requestAnimationFrame(animate);
        }
      }
    };

    window.addEventListener(ORIENTATION_EVENT, onOrientation, true);
    return () => {
      window.removeEventListener(ORIENTATION_EVENT, onOrientation, true);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [permission, animate]);

  const requestAccess = async () => {
    const result = await requestOrientationPermission();
    setPermission(result);
    setNeedsGrant(false);
  };

  useEffect(() => {
    if (isIOSSafari()) {
      setNeedsGrant(true);
    } else if (typeof DeviceOrientationEvent !== 'undefined' && 'ondeviceorientation' in window) {
      setPermission('unavailable');
    }
  }, []);

  const needleRotation = ((bearing - heading + 360) % 360);
  const hasRealSensor = permission === 'unavailable' || permission === 'granted';

  return (
    <div
      id="qibla-calculation-panel"
      className="rounded-2xl bg-surface shadow-sm border border-border-custom overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border-custom">
        <span className="font-semibold text-text-primary">
          {isArabic ? 'اتجاه القبلة' : 'Qibla Direction'}
        </span>
      </div>

      <div className="p-4 flex flex-col items-center gap-4">
        {needsGrant && (
          <button
            id="btn-request-compass-permission"
            onClick={requestAccess}
            className="w-full rounded-xl bg-primary/15 border border-primary/30 px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:bg-primary/25 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            {isArabic ? 'تفعيل البوصلة' : 'Enable Compass'}
          </button>
        )}

        {/* Compass dial */}
        <div id="compass-box" className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: `rotate(${-heading}deg)` }}>
            <circle cx="50" cy="50" r="48" className="fill-surface-muted" stroke="currentColor" strokeWidth="0.5" />

            {/* Cardinal labels */}
            <text x="50" y="9" textAnchor="middle" className="fill-text-primary text-[7px] font-bold">N</text>
            <text x="95" y="52" textAnchor="middle" className="fill-text-secondary text-[6px] font-semibold">E</text>
            <text x="50" y="97" textAnchor="middle" className="fill-text-secondary text-[6px] font-semibold">S</text>
            <text x="5" y="52" textAnchor="middle" className="fill-text-secondary text-[6px] font-semibold">W</text>

            {/* Tick marks */}
            {Array.from({ length: 36 }, (_, i) => {
              const angle = i * 10;
              const r1 = 43;
              const r2 = angle % 30 === 0 ? 39 : 41;
              const rad = (angle * Math.PI) / 180;
              return (
                <line
                  key={i}
                  x1={50 + r1 * Math.sin(rad)}
                  y1={50 - r1 * Math.cos(rad)}
                  x2={50 + r2 * Math.sin(rad)}
                  y2={50 - r2 * Math.cos(rad)}
                  stroke="currentColor"
                  strokeWidth={angle % 30 === 0 ? 1.2 : 0.5}
                  className="text-text-secondary/40"
                />
              );
            })}

            {/* Qibla indicator arrow */}
            <g transform={`rotate(${bearing} 50 50)`}>
              <line x1="50" y1="8" x2="50" y2="50" stroke="currentColor" strokeWidth="4" className="text-primary" />
              <line x1="50" y1="50" x2="50" y2="92" stroke="currentColor" strokeWidth="2" className="text-text-secondary" />
            </g>
          </svg>

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/40" />
          </div>

          {/* Needle overlay (only when sensor active) */}
          {hasRealSensor && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-transparent border-b-accent-gold drop-shadow" />
            </div>
          )}
        </div>

        {/* Info grid */}
        <div id="info-qibla-grid" className="grid grid-cols-2 gap-2 w-full max-w-xs">
          <div className="rounded-xl bg-surface-muted px-3 py-2 text-center">
            <p className="text-xs text-text-secondary">{isArabic ? 'اتجاه القبلة' : 'Bearing'}</p>
            <p className="text-lg font-bold text-text-primary" dir="ltr">
              {bearing}°
            </p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2 text-center">
            <p className="text-xs text-text-secondary">{isArabic ? 'الموقع' : 'Location'}</p>
            <p className="text-lg font-bold text-text-primary truncate" dir="ltr">
              {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="w-full max-w-xs rounded-xl bg-surface-muted px-3 py-2 text-center">
          <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            {isArabic ? 'المسافة إلى الكعبة' : 'Distance to Kaaba'}
          </p>
          <p className="text-lg font-bold text-text-primary" dir="ltr">
            {formatted}
          </p>
        </div>
      </div>
    </div>
  );
};
