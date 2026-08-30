/**
 * ZAD — Release configuration (single source of truth for distribution).
 *
 * This file defines the Android release version shown in the download UI
 * and the official APK download URL (GitHub Releases asset).
 *
 * ── HOW FUTURE RELEASES WORK ────────────────────────────────────────────
 * 1. Bump APP_VERSION below           (v1.0.0 → v1.1.0 → v1.2.0 ...)
 * 2. In android/app/build.gradle:
 *      - versionCode MUST be incremented by at least 1 on EVERY release
 *        (Android/Play use this to detect updates). Current: 1.
 *      - versionName should match APP_VERSION (e.g. "1.1.0").
 * 3. Rebuild + sync + sign:
 *        npm run build:native
 *        npx cap sync android
 *        cd android ; ./gradlew assembleRelease
 * 4. Copy the signed APK to:
 *        releases/ZAD-v1.1.0.apk
 *    (from android/app/build/outputs/apk/release/app-release.apk)
 * 5. Create the GitHub Release with tag v1.1.0 and upload
 *    ZAD-v1.1.0.apk as the ONLY APK asset (signed release only).
 * 6. Update ANDROID_APK_URL below to point at the new asset.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Human-readable app version shown in the download UI. */
export const APP_VERSION = '1.0.0';

/**
 * ⚠️ CONFIGURABLE CONSTANT — update after publishing the GitHub Release.
 *
 * This URL only becomes live once the GitHub Release with tag "v1.0.0"
 * exists AND the asset "ZAD-v1.0.0.apk" has been uploaded to it.
 * Until then, the download button will return a 404.
 *
 * 👉 After you publish the release, verify this URL (it should download
 *    the APK directly). If your release tag or asset name differs,
 *    change ONLY this constant.
 */
export const ANDROID_APK_URL =
  'https://github.com/sana-oss/ZAD/releases/download/v1.0.0/ZAD-v1.0.0.apk';

/** Official production web/PWA URL (GitHub Pages). */
export const WEB_APP_URL = 'https://sana-oss.github.io/ZAD/';
