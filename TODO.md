# Quran Reader Theme & Contrast Fix — TODO

## Steps

- [x] 1. Fix `ZAD/src/index.css` — Remove the problematic `.dark` force-light override for Quran text that causes pale/invisible text on light backgrounds.
- [x] 2. Fix `ZAD/src/components/QuranSection.tsx` — Ensure all Quran text on the reading panel explicitly uses dark colors appropriate for light (cream/white) backgrounds.
- [x] 3. Fix `ZAD/src/components/MushafPageView.tsx` — Apply the same explicit dark text color logic for the Mushaf page view.
- [x] 4. Sync the Quran panel theme state into `settings` so components stay consistent.
- [x] 5. Verify the changes (text dark & readable on cream/white themes, dark mode rest of UI still works).
