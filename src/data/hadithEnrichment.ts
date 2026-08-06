import { Hadith, NarratorProfile, BookMetadata, HadithCommentary } from '../types';

export const narratorProfiles: Record<string, NarratorProfile> = {
  "'Umar bin Al-Khattab": {
    fullName: "'Umar ibn al-Khattab",
    totalNarrations: 537,
    deathYear: "644 CE",
  },
  "'Aisha": {
    fullName: "'Aisha bint Abi Bakr",
    totalNarrations: 2210,
    deathYear: "678 CE",
  },
  "Jabir bin 'Abdullah Al-Ansari": {
    fullName: "Jabir ibn 'Abdullah al-Ansari",
    totalNarrations: 154,
    deathYear: "697 CE",
  },
  "Ibn 'Abbas": {
    fullName: "'Abdullah ibn 'Abbas",
    totalNarrations: 1660,
    deathYear: "687 CE",
  },
  "Abu Huraira": {
    fullName: "Abu Hurairah (Abd al-Rahman ibn Sakhr)",
    totalNarrations: 5374,
    deathYear: "681 CE",
  },
  "'Abdullah bin 'Amr": {
    fullName: "'Abdullah ibn 'Amr ibn al-'As",
    totalNarrations: 256,
    deathYear: "684 CE",
  },
  "Said bin Jubair": {
    fullName: "Sa'id ibn Jubayr",
    totalNarrations: 135,
    deathYear: "714 CE",
  },
};

export const bookMetadata: Record<string, BookMetadata> = {
  "Sahih al-Bukhari": {
    author: "Muhammad al-Bukhari",
    totalCount: 7563,
    authenticityNotes: "Considered the most authentic book after the Quran. Compiled in 846 CE with strict criteria for isnad.",
  },
  "Sahih Muslim": {
    author: "Muslim ibn al-Hajjaj",
    totalCount: 5521,
    authenticityNotes: "Second most authentic hadith collection. Compiled with rigorous verification standards.",
  },
  "Jami' at-Tirmidhi": {
    author: "Muhammad ibn 'Isa at-Tirmidhi",
    totalCount: 3956,
    authenticityNotes: "Contains sahih, hasan, and daif hadiths with grading by the author himself.",
  },
  "Sunan an-Nasa'i": {
    author: "Ahmad ibn Shu'ayb an-Nasa'i",
    totalCount: 5754,
    authenticityNotes: "One of the six major hadith collections, known for its precise isnad analysis.",
  },
  "Sunan Abu Dawud": {
    author: "Abu Dawud al-Sijistani",
    totalCount: 5274,
    authenticityNotes: "Focuses on hadiths related to fiqh (jurisprudence) with detailed grading.",
  },
};

const topicKeywords: Record<string, string[]> = {
  "prayer": ["prayer", "salah", "salat", "pray", "wudu", "ablution", "mosque", "masjid"],
  "fasting": ["fast", "ramadan", "fasting", "sawm", "suhoor", "iftar"],
  "charity": ["zakat", "sadaqah", "charity", "poor", "wealth", "rich", "money", "gold"],
  "faith": ["faith", "iman", "belief", "heart", "soul", "righteousness"],
  "prophets": ["prophet", "muhammad", "revelation", "wahi", "quran", "moses", "abraham"],
  "character": ["character", "manners", "kindness", "patience", "anger", "modesty", "haya"],
  "family": ["family", "wife", "husband", "mother", "father", "children", "marriage", "divorce"],
  "knowledge": ["knowledge", "learn", "seek", "teach", "wisdom", "scholar", "student"],
  "supplication": ["supplication", "dua", "pray", "invoke", "ask", "call upon"],
  "repentance": ["repentance", "forgive", "mercy", "sin", "tawbah", "repent"],
};

function detectTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      detected.push(topic);
    }
  }

  return detected;
}

function generateCommentary(hadith: Hadith): HadithCommentary {
  const complexTerms: Record<string, string> = {};
  const keyLessons: string[] = [];
  const practicalApplications: string[] = [];

  if (hadith.textEn.toLowerCase().includes('intention') || hadith.textEn.toLowerCase().includes('niyyah')) {
    complexTerms['Niyyah'] = 'Intention in Arabic; the inner purpose behind any action.';
    keyLessons.push('Actions are judged by their intentions.');
    practicalApplications.push('Before any act, pause and clarify your sincere intention.');
  }

  if (hadith.textEn.toLowerCase().includes('prayer') || hadith.textEn.toLowerCase().includes('salah')) {
    complexTerms['Salah'] = 'The formal Islamic prayer performed five times daily.';
    keyLessons.push('Prayer is the foundation of the deen.');
    practicalApplications.push('Prioritize establishing the five daily prayers at their prescribed times.');
  }

  if (hadith.textEn.toLowerCase().includes('forgiv') || hadith.textEn.toLowerCase().includes('mercy')) {
    keyLessons.push('Allah is the Most Merciful and welcomes repentance.');
    practicalApplications.push('Turn to Allah in repentance regularly, regardless of past mistakes.');
  }

  if (hadith.textEn.toLowerCase().includes('generous') || hadith.textEn.toLowerCase().includes('charity')) {
    keyLessons.push('Generosity is a hallmark of faith.');
    practicalApplications.push('Give regularly in charity, even small amounts, to cultivate gratitude.');
  }

  if (keyLessons.length === 0) {
    keyLessons.push('This hadith teaches an important principle of Islamic guidance.');
    practicalApplications.push('Reflect on how this teaching applies to your daily life.');
  }

  return { complexTerms, keyLessons, practicalApplications };
}

export function enrichHadith(hadith: Hadith): Hadith {
  const narratorProfile = narratorProfiles[hadith.narrator];
  const bookMetadataEntry = bookMetadata[hadith.book];
  const commentary = generateCommentary(hadith);

  const detectedTopics = detectTopics(hadith.textEn);
  const mergedTags = [...new Set([...hadith.tags, ...detectedTopics])];

  return {
    ...hadith,
    narratorProfile,
    bookMetadata: bookMetadataEntry,
    commentary,
    tags: mergedTags,
  };
}

export function enrichHadiths(hadiths: Hadith[]): Hadith[] {
  return hadiths.map(enrichHadith);
}
