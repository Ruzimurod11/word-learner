import { count, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.ts";
import { words } from "../db/schema.ts";
import { mapWithConcurrency } from "../utils/concurrency.ts";

export interface BackfillResult {
  updated: number;
  remaining: number;
}

// Google TTS Neural2 kvotasi ~1000 so'rov/daqiqa; 6 parallel ~720/daqiqa
// beradi va DB pool'ining 10 ta ulanishidan ham oshmaydi.
const CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 10000;

// Google Cloud Text-to-Speech API dan audio generate qiladi
async function generateAudioUrl(word: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_TTS_API_KEY not set");
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Google Cloud Text-to-Speech API call
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: word },
          voice: {
            languageCode: "en-US",
            name: "en-US-Neural2-A",
          },
          audioConfig: {
            audioEncoding: "MP3",
            pitch: 0,
            speakingRate: 1,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Google TTS error:", error);
      return null;
    }

    const data = (await response.json()) as { audioContent?: string };
    if (!data.audioContent) return null;

    // Audio content base64 da keladi, data URI ga aylantiramiz
    const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
    return audioUrl;
  } catch (err) {
    console.error("TTS generation error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Audiosiz so'zlarni sanaydi
async function countMissing(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(words)
    .where(isNull(words.audioUrl));
  return row?.value ?? 0;
}

// NULL audioUrl uchun Google TTS orqali audio generate qiladi.
// Bir chaqiruvda ko'pi bilan `limit` ta so'z qayta ishlanadi — qolganini
// chaqiruvchi takroran so'raydi (`remaining` nolga tushguncha).
export async function backfillAudioWithGoogleTts(
  limit: number,
): Promise<BackfillResult> {
  const missing = await db
    .select({ id: words.id, english: words.english })
    .from(words)
    .where(isNull(words.audioUrl))
    .limit(limit);

  if (missing.length === 0) {
    return { updated: 0, remaining: 0 };
  }

  // Generate va yozish bir oqimda: DB uzoq serverda (~200ms round-trip),
  // shuning uchun UPDATE'lar ham ketma-ket emas, parallel ketadi.
  const done = await mapWithConcurrency(missing, CONCURRENCY, async (w) => {
    const audioUrl = await generateAudioUrl(w.english);
    if (!audioUrl) return false;
    await db
      .update(words)
      .set({ audioUrl, updatedAt: new Date() })
      .where(eq(words.id, w.id));
    return true;
  });

  const updated = done.filter(Boolean).length;
  return { updated, remaining: await countMissing() };
}
