import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isNull, sql } from "drizzle-orm";
import { db, pool } from "./index.ts";
import { words } from "./schema.ts";

// Bir martalik skript: transcriptions.json dagi IPA'larni words.transcription ga yozadi.
// Idempotent — qayta ishga tushirilsa ham xuddi shu natija.
async function main(): Promise<void> {
  const jsonPath = fileURLToPath(new URL("./transcriptions.json", import.meta.url));
  const map: Record<string, string> = JSON.parse(readFileSync(jsonPath, "utf8"));

  let updated = 0;
  for (const [english, ipa] of Object.entries(map)) {
    const result = await db
      .update(words)
      .set({ transcription: ipa })
      .where(sql`lower(${words.english}) = lower(${english})`)
      .returning({ id: words.id });
    updated += result.length;
  }

  const missing = await db
    .select({ english: words.english })
    .from(words)
    .where(isNull(words.transcription));

  console.log(`Updated: ${updated}`);
  console.log(`Still without transcription: ${missing.length}`);
  for (const m of missing) console.log(`  - ${m.english}`);

  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
