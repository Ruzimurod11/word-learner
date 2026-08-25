import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { words } from "../db/schema.ts";
import { isBritishIpa, normalizeBritishIpa } from "../utils/ipa.ts";
import { mapWithConcurrency } from "../utils/concurrency.ts";

export interface BackfillResult {
  updated: number;
  remaining: number;
}

// Bepul, kalit talab qilmaydigan lug'at API (Wiktionary manbali — bizning IPA
// uslubimizga mos konvensiya).
const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
// Bepul API'ni ortiqcha yuklamaslik uchun bir vaqtda cheklangan so'rov.
const CONCURRENCY = 3;
const REQUEST_TIMEOUT_MS = 8000;
// partOfSpeechService bilan bir xil: API qisqa oynada ~25 ta so'rovdan keyin
// 429 qaytaradi, lekin ~1 soniyada tiklanadi — shuning uchun kutib qayta uriniladi.
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
// Bir bosishda ishlanadigan so'z soni: so'rov cheksiz cho'zilib ketmasin.
const BATCH_LIMIT = 100;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface DictPhonetic {
  text?: string;
}
interface DictEntry {
  phonetic?: string;
  phonetics?: DictPhonetic[];
}

// IPA matnini bizning uslubga keltiradi: slash/qavslar, bo'g'in nuqtalari va
// ixtiyoriy (ɹ) guruhlarini olib tashlaydi, bog'lovchi tie'larni yo'qotadi,
// ɹ -> r, so'ng britaniyacha urg'u konvensiyasiga keltiradi.
function cleanIpa(raw: string): string {
  const cleaned = raw
    .replace(/[/[\]]/g, "") // /.../ va [...]
    .replace(/\([^)]*\)/g, "") // ixtiyoriy (ɹ) kabi guruhlar
    .replace(/[͜͡‿]/g, "") // tie belgilari: t͡ʃ -> tʃ
    .replace(/[̩̍]/g, "") // syllabic belgisi: l̩ -> l
    .replace(/ɹ/g, "r")
    .replace(/ɛ/g, "e") // house-style DRESS unlisi: ɛ -> e
    .replace(/[.\s]/g, "") // bo'g'in nuqtalari va bo'shliqlar
    .trim();
  return normalizeBritishIpa(cleaned);
}

function isUsable(ipa: string): boolean {
  // Chalkash/qisman shakllarni rad etamiz (masalan "-ɪ").
  if (ipa.length < 2) return false;
  if (/[-0-9]/.test(ipa)) return false;
  // API amerikacha va tor transkripsiyalarni ham qaytaradi — ularni yozgandan
  // ko'ra katakni bo'sh qoldirgan ma'qul.
  return isBritishIpa(ipa);
}

// Nomzodlardan uy uslubiga mos birinchisini tanlaydi.
function pickIpa(entries: DictEntry[]): string | null {
  const candidates: string[] = [];
  for (const e of entries) {
    for (const p of e.phonetics ?? []) {
      if (p.text) candidates.push(p.text);
    }
    if (e.phonetic) candidates.push(e.phonetic);
  }

  return candidates.map(cleanIpa).find(isUsable) ?? null;
}

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

async function fetchIpa(word: string): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await fetchOnce(word);
    if (Array.isArray(result)) return pickIpa(result);
    if (result !== 429) return null; // 404 va boshqa xatolar -> o'tkazamiz
    if (attempt < MAX_RETRIES) await sleep(RETRY_BASE_MS * 2 ** attempt);
  }
  return null;
}

// transcription IS NULL bo'lgan so'zlarga lug'at API orqali British IPA yaratib
// bazaga yozadi (bir bosishda BATCH_LIMIT tagacha). IPA topilmagan so'zlar
// o'tkazib yuboriladi va keyingi bosishda qayta uriniladi. `remaining` — shu
// partiyadan qolganlar emas, balki bazadagi jami transkripsiyasiz so'zlar soni.
export async function backfillTranscriptions(): Promise<BackfillResult> {
  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(words)
    .where(isNull(words.transcription));
  const totalMissing = countRow?.count ?? 0;

  const missing = await db
    .select({ id: words.id, english: words.english })
    .from(words)
    .where(isNull(words.transcription))
    // tasodifiy tanlov: lug'atda topilmaydigan so'zlar partiyani doimiy
    // band qilib, qolganlariga navbat kelmay qolmasin
    .orderBy(sql`random()`)
    .limit(BATCH_LIMIT);

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

  return { updated, remaining: totalMissing - updated };
}
