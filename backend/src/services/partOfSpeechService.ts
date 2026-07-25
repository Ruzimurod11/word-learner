import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { words } from "../db/schema.ts";
import type { PartOfSpeech } from "../types/word.ts";
import { pickPartOfSpeech, type DictEntry } from "../utils/partOfSpeech.ts";
import { mapWithConcurrency } from "../utils/concurrency.ts";

export interface BackfillResult {
  updated: number;
  remaining: number;
}

// transcriptionService bilan bir xil bepul lug'at API'si.
const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const CONCURRENCY = 3;
const REQUEST_TIMEOUT_MS = 8000;
// API qisqa oynada ~25 ta so'rovdan keyin 429 qaytaradi, lekin ~1 soniyada
// tiklanadi — shuning uchun 429'da kutib qayta uriniladi.
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
// Bir bosishda ishlanadigan so'z soni: so'rov cheksiz cho'zilib ketmasin
// (~1.8 so'z/sek). Qolganlari uchun tugma qayta bosiladi.
const BATCH_LIMIT = 100;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(word: string): Promise<DictEntry[] | number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return res.status; // 404 (topilmadi) yoki 429 (limit)
    const data = (await res.json()) as DictEntry[];
    return Array.isArray(data) ? data : 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPartOfSpeech(word: string): Promise<PartOfSpeech | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await fetchOnce(word);
    if (Array.isArray(result)) return pickPartOfSpeech(result);
    if (result !== 429) return null; // 404 va boshqa xatolar -> o'tkazamiz
    if (attempt < MAX_RETRIES) await sleep(RETRY_BASE_MS * 2 ** attempt);
  }
  return null;
}

// part_of_speech IS NULL bo'lgan so'zlarga lug'at API orqali turkum yozadi
// (bir bosishda BATCH_LIMIT tagacha). Turkum topilmagan so'zlar o'tkazib
// yuboriladi va keyingi bosishda qayta uriniladi. `remaining` — shu partiyadan
// to'ldirilmay qolganlar emas, balki bazadagi jami turkumsiz so'zlar soni.
export async function backfillPartsOfSpeech(): Promise<BackfillResult> {
  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(words)
    .where(isNull(words.partOfSpeech));
  const totalMissing = countRow?.count ?? 0;

  const missing = await db
    .select({ id: words.id, english: words.english })
    .from(words)
    .where(isNull(words.partOfSpeech))
    // tasodifiy tanlov: lug'atda topilmaydigan so'zlar partiyani doimiy
    // band qilib, qolganlariga navbat kelmay qolmasin
    .orderBy(sql`random()`)
    .limit(BATCH_LIMIT);

  const parts = await mapWithConcurrency(missing, CONCURRENCY, (w) =>
    fetchPartOfSpeech(w.english),
  );

  let updated = 0;
  for (let i = 0; i < missing.length; i++) {
    const part = parts[i];
    if (!part) continue;
    await db
      .update(words)
      .set({ partOfSpeech: part, updatedAt: new Date() })
      .where(eq(words.id, missing[i].id));
    updated += 1;
  }

  return { updated, remaining: totalMissing - updated };
}
