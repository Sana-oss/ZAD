// scripts/fetchHadiths.mjs
// Run with: node scripts/fetchHadiths.mjs
// Requires Node 18+ (for native fetch)
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';

// How many hadiths to take from each book
const LIMIT_PER_BOOK = 100;

const BOOKS = [
  { key: 'bukhari',  name: 'Sahih al-Bukhari',  defaultGrade: 'Sahih' },
  { key: 'muslim',   name: 'Sahih Muslim',       defaultGrade: 'Sahih' },
  { key: 'tirmidhi', name: "Jami' at-Tirmidhi",  defaultGrade: null },
  { key: 'abudawud', name: 'Sunan Abu Dawud',    defaultGrade: null },
  { key: 'nasai',    name: "Sunan an-Nasa'i",    defaultGrade: null },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractNarrator(text) {
  const match = text?.match(/^Narrated\s+([^:]+):/i);
  if (match) return match[1].trim();
  return 'Unknown';
}

function mapGrade(grades, defaultGrade) {
  if (defaultGrade) return defaultGrade;
  if (!grades || grades.length === 0) return 'Unknown';
  const raw = (grades[0]?.grade || '').toLowerCase();
  if (raw.includes('sahih')) return 'Sahih';
  if (raw.includes('hasan')) return 'Hasan';
  if (raw.includes('da') || raw.includes('weak')) return 'Daif';
  return 'Unknown';
}

async function fetchEdition(editionKey) {
  const url = `${BASE_URL}/${editionKey}.min.json`;
  console.log(`  Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${editionKey}`);
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const allHadiths = [];
  let counter = 1;

  for (const book of BOOKS) {
    console.log(`\n📚 Processing ${book.name}...`);

    let engData, araData;
    try {
      [engData, araData] = await Promise.all([
        fetchEdition(`eng-${book.key}`),
        fetchEdition(`ara-${book.key}`),
      ]);
    } catch (err) {
      console.warn(`  ⚠️  Skipping ${book.name}: ${err.message}`);
      continue;
    }

    const engSlice = engData.hadiths.slice(0, LIMIT_PER_BOOK);
    // Build a quick lookup for Arabic text by hadith number
    const araMap = new Map(araData.hadiths.map(h => [h.hadithnumber, h.text]));

    for (const h of engSlice) {
      const narrator = extractNarrator(h.text);
      const grade    = mapGrade(h.grades, book.defaultGrade);
      const textAr   = araMap.get(h.hadithnumber) || '';
      const refBook  = h.reference?.book   ?? '';
      const refHadith = h.reference?.hadith ?? h.hadithnumber;
      const reference = refBook
        ? `Book ${refBook}, Hadith ${refHadith}`
        : `Hadith ${refHadith}`;

      allHadiths.push({
        id:        `h-real-${counter++}`,
        textAr,
        textEn:    h.text,
        narrator,
        book:      book.name,
        grade,
        reference,
        tags:      [],          // tags can be enriched later
      });
    }

    console.log(`  ✅ Added ${engSlice.length} hadiths`);
  }

  console.log(`\n📊 Total: ${allHadiths.length} hadiths collected`);

  // ── Serialize to TypeScript ─────────────────────────────────────────────────
  const tsContent = `import { Hadith } from '../types';

// ⚠️ AUTO-GENERATED — do not edit manually.
// To regenerate, run: node scripts/fetchHadiths.mjs
// Source: https://github.com/fawazahmed0/hadith-api
export const hadiths: Hadith[] = ${JSON.stringify(allHadiths, null, 2)};
`;

  const outPath = join(__dirname, '..', 'src', 'data', 'hadiths.ts');
  writeFileSync(outPath, tsContent, 'utf8');
  console.log(`\n✨ Written to ${outPath}`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
