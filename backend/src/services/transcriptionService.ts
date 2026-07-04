import { eq, isNull } from "drizzle-orm";
import { db } from "../db/index.ts";
import { words } from "../db/schema.ts";

export interface BackfillResult {
  updated: number;
  remaining: number;
}

// Bepul, kalit talab qilmaydigan lug'at API (Wiktionary manbali — bizning IPA
// uslubimizga mos konvensiya).
const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
// Bepul API'ni ortiqcha yuklamaslik uchun bir vaqtda cheklangan so'rov.
const CONCURRENCY = 5;
const REQUEST_TIMEOUT_MS = 8000;

interface DictPhonetic {
  text?: string;
}
interface DictEntry {
  phonetic?: string;
  phonetics?: DictPhonetic[];
}

// IPA matnini bizning uslubga keltiradi: slash/qavslar, bo'g'in nuqtalari va
// ixtiyoriy (ɹ) guruhlarini olib tashlaydi, bog'lovchi tie'larni yo'qotadi,
// ɹ -> r.
function cleanIpa(raw: string): string {
  return raw
    .replace(/[/[\]]/g, "") // /.../ va [...]
    .replace(/\([^)]*\)/g, "") // ixtiyoriy (ɹ) kabi guruhlar
    .replace(/[͜͡‿]/g, "") // tie belgilari: t͡ʃ -> tʃ
    .replace(/[̩̍]/g, "") // syllabic belgisi: l̩ -> l
    .replace(/ɹ/g, "r")
    .replace(/ɛ/g, "e") // house-style DRESS unlisi: ɛ -> e
    .replace(/[.\s]/g, "") // bo'g'in nuqtalari va bo'shliqlar
    .trim();
}

function isUsable(ipa: string): boolean {
  // Chalkash/qisman shakllarni rad etamiz (masalan "-ɪ").
  if (ipa.length < 2) return false;
  if (/[-0-9]/.test(ipa)) return false;
  return true;
}

// Bir nechta variantdan britaniyacha ko'rinadiganini tanlaydi.
function pickIpa(entries: DictEntry[]): string | null {
  const candidates: string[] = [];
  for (const e of entries) {
    for (const p of e.phonetics ?? []) {
      if (p.text) candidates.push(p.text);
    }
    if (e.phonetic) candidates.push(e.phonetic);
  }

  const cleaned = candidates.map(cleanIpa).filter(isUsable);
  if (cleaned.length === 0) return null;

  // Amerikacha markerlar (r-rangli/flap) bo'lmagan variantni afzal ko'ramiz.
  const british = cleaned.find((x) => !/[ɚɝɾ]/.test(x));
  return british ?? cleaned[0];
}

async function fetchIpa(word: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return null; // 404 (topilmadi) yoki 429 (limit) -> o'tkazamiz
    const data = (await res.json()) as DictEntry[];
    if (!Array.isArray(data)) return null;
    return pickIpa(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// transcription IS NULL bo'lgan barcha so'zlarga lug'at API orqali British IPA
// yaratib bazaga yozadi. IPA topilmagan so'zlar o'tkazib yuboriladi (keyingi
// bosishda qayta uriniladi).
export async function backfillTranscriptions(): Promise<BackfillResult> {
  const missing = await db
    .select({ id: words.id, english: words.english })
    .from(words)
    .where(isNull(words.transcription));

  const ipas = await mapWithConcurrency(missing, CONCURRENCY, (w) =>
    fetchIpa(w.english),
  );

  let updated = 0;
  for (let i = 0; i < missing.length; i++) {
    const ipa = ipas[i];
    if (!ipa) continue;
    await db
      .update(words)
      .set({ transcription: ipa, updatedAt: new Date() })
      .where(eq(words.id, missing[i].id));
    updated += 1;
  }

  return { updated, remaining: missing.length - updated };
}
