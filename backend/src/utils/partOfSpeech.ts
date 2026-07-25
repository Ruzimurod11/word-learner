import type { PartOfSpeech } from "../types/word.ts";

// dictionaryapi.dev `meanings[].partOfSpeech` qiymatlari -> bizning qisqartmalar
const API_MAP: Record<string, PartOfSpeech> = {
  noun: "n",
  verb: "v",
  adjective: "adj",
  adverb: "adv",
  pronoun: "pron",
  preposition: "prep",
  conjunction: "conj",
  determiner: "det",
  article: "article",
  interjection: "interj",
  exclamation: "interj",
  numeral: "num",
  number: "num",
  phrase: "phr",
};

// Noma'lum qiymat null qaytaradi — bunday ma'no e'tiborga olinmaydi.
export function mapApiPartOfSpeech(raw: string): PartOfSpeech | null {
  return API_MAP[raw.trim().toLowerCase()] ?? null;
}

export interface DictMeaning {
  partOfSpeech?: string;
  definitions?: unknown[];
}

export interface DictEntry {
  meanings?: DictMeaning[];
}

// API ma'nolarni chastota bo'yicha emas, etimologiya bo'yicha tartiblaydi
// (masalan "cruel" da verb birinchi keladi), shuning uchun birinchisini olish
// noto'g'ri. Buning o'rniga eng ko'p ta'rifga ega turkumni tanlaymiz — bu
// so'zning asosiy turkumiga ancha yaqin natija beradi. Teng bo'lsa — birinchi
// uchragani.
export function pickPartOfSpeech(entries: DictEntry[]): PartOfSpeech | null {
  const counts = new Map<PartOfSpeech, number>();
  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      if (!meaning.partOfSpeech) continue;
      const mapped = mapApiPartOfSpeech(meaning.partOfSpeech);
      if (!mapped) continue;
      counts.set(mapped, (counts.get(mapped) ?? 0) + (meaning.definitions?.length ?? 0));
    }
  }

  let best: PartOfSpeech | null = null;
  let bestCount = -1;
  for (const [part, count] of counts) {
    if (count > bestCount) {
      best = part;
      bestCount = count;
    }
  }
  return best;
}
