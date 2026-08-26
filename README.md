# ZAD

**ZAD** is a modern Islamic spiritual companion web app — a single, focused space for daily remembrance (adhkar), Qur'an reading, hadith study, prayer times, and personal reflection. The interface is bilingual (Arabic/English) with light/dark themes and a clean, mobile-first design.

## Features

- **Home Dashboard** — A two-tone "Daily Tip" card, Hadith of the Day, Qur'an progress, and quick access to every section.
- **Adhkar (أذكار)** — 16 categorized dhikr collections (morning, evening, sleep, travel, prayer, and more) with a built-in tasbih counter, favorites, and a daily completion streak.
- **Qur'an** — Read by surah, juz, or mushaf page; track reading progress with surah names (Arabic/English), theme options (white/cream), and a progress card on the home screen.
- **Hadith** — A paginated card view with grade (Sahih/Hasan/Daif), narrator profiles, book metadata, and per-hadith commentary (key lessons & practical applications).
- **Prayer Times** — Accurate prayer times based on location, with customizable notifications, calculation method, and an adhan sound scheduler.
- **Qibla Compass** — Direction to the Kaaba from the user's location.
- **Premium Quotes** — Curated daily quotes with shareable image generation.
- **Settings** — Theme (light/dark), Arabic font family, font size, app language, and adhan preferences (takbeer / full adhan / call).
- **Audio & Notifications** — Global audio player and a background adhan scheduler (`useAdhanScheduler`).

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), `motion` for animation |
| Icons | `lucide-react` |
| AI | `@google/genai` |
| Server | Express (Node) + `tsx` |
| Config | `dotenv`, `autoprefixer` |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm run dev

# Type-check / lint
npm run lint

# Production build
npm run build

# Preview the production build
npm run preview
```

> Requires Node.js (the project uses ESM and modern tooling — Node 18+ recommended).

## Project Structure

```
src/
├── App.tsx                 # Tab-based routing (home, adhkar, quran, hadith, prayer, settings)
├── context/AppContext.tsx # Global state & user settings
├── components/            # UI sections (Home, Adhkar, Quran, Hadith, Prayer, Qibla, Settings, …)
├── data/                  # Static datasets (adhkar, hadiths, quran, daily tips, juz mapping)
├── hooks/                 # Custom hooks (e.g. useAdhanScheduler)
├── services/              # API/domain logic (prayer times, qibla, quran, hadith, quotes)
└── types.ts               # Shared TypeScript types
```

## License

Apache-2.0
