import "dotenv/config";
import { eq, isNotNull } from "drizzle-orm";
import { normalizeBritishIpa } from "../utils/ipa.ts";
import { db, pool } from "./index.ts";
import { words } from "./schema.ts";

// Bir martalik skript: mavjud transkripsiyalarni britaniyacha (OALD/Cambridge)
// uslubga keltiradi. Idempotent — ikkinchi marta ishga tushirilsa 0 o'zgarish.
// Standart rejim — dry-run; yozish uchun `--apply` bayrog'i kerak.

// Qoida bilan tuzatib bo'lmaydigan, qo'lda aniqlangan xatolar.
const MANUAL: Record<string, string> = {
  jumper: "ˈdʒʌmpə", // urg'usiz va noto'g'ri unli (dʒʊmpə) bilan yozilgan edi
};

// Iborada mustaqil so'z bo'lib turgan `of` ning kuchsiz shakli.
function weakForms(ipa: string): string {
  return ipa.replace(/(^| )ɒv(?= |$)/g, "$1əv");
}

function normalize(english: string, ipa: string): string {
  const manual = MANUAL[english.toLowerCase()];
  if (manual) return manual;
  return weakForms(normalizeBritishIpa(ipa));
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");

  const rows = await db
    .select({ id: words.id, english: words.english, transcription: words.transcription })
    .from(words)
    .where(isNotNull(words.transcription));

  const changes = rows
    .map((row) => ({ ...row, next: normalize(row.english, row.transcription!) }))
    .filter((row) => row.next !== row.transcription);

  for (const change of changes) {
    console.log(`${change.english}: ${change.transcription} -> ${change.next}`);
  }

  if (apply) {
    for (const change of changes) {
      await db
        .update(words)
        .set({ transcription: change.next, updatedAt: new Date() })
        .where(eq(words.id, change.id));
    }
    console.log(`\nApplied: ${changes.length} of ${rows.length}`);
  } else {
    console.log(`\nDry run: ${changes.length} of ${rows.length} would change.`);
    console.log("Re-run with --apply to write.");
  }

  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Normalize failed:", err);
  process.exit(1);
});
