import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { and, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, pool } from "./index.ts";
import { words } from "./schema.ts";
import { PARTS_OF_SPEECH, type PartOfSpeech } from "../types/word.ts";
import { isBritishIpa } from "../utils/ipa.ts";

// Qo'lda tuzilgan transkripsiya/turkum ro'yxati (`wordMeta.json`) ni bazaga
// yozadi — lug'at API topa olmaydigan iboralar va noyob so'zlar uchun.
// Faqat bo'sh kataklarni to'ldiradi, mavjud qiymat ustidan yozmaydi.
// Standart rejim — dry-run; yozish uchun `--apply` bayrog'i kerak.

interface Meta {
  ipa?: string;
  pos?: PartOfSpeech;
}

const VALID_POS = new Set<string>(PARTS_OF_SPEECH);

function validate(entries: [string, Meta][]): string[] {
  const problems: string[] = [];
  for (const [english, meta] of entries) {
    if (english !== english.toLowerCase()) {
      problems.push(`${english}: kalit kichik harfda bo'lishi kerak`);
    }
    if (meta.ipa && !isBritishIpa(meta.ipa)) {
      problems.push(`${english}: uy uslubiga mos kelmaydigan IPA "${meta.ipa}"`);
    }
    if (meta.pos && !VALID_POS.has(meta.pos)) {
      problems.push(`${english}: noma'lum turkum "${meta.pos}"`);
    }
    if (!meta.ipa && !meta.pos) {
      problems.push(`${english}: bo'sh yozuv`);
    }
  }
  return problems;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const jsonPath = fileURLToPath(new URL("./wordMeta.json", import.meta.url));
  const entries = Object.entries(
    JSON.parse(readFileSync(jsonPath, "utf8")) as Record<string, Meta>,
  );

  const problems = validate(entries);
  if (problems.length > 0) {
    for (const p of problems) console.error(`  ! ${p}`);
    throw new Error(`${problems.length} ta yaroqsiz yozuv`);
  }

  let matched = 0;
  let unused = 0;
  for (const [english, meta] of entries) {
    const set: { transcription?: SQL; partOfSpeech?: SQL; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (meta.ipa) {
      set.transcription = sql`coalesce(${words.transcription}, ${meta.ipa})`;
    }
    if (meta.pos) {
      set.partOfSpeech = sql`coalesce(${words.partOfSpeech}, ${meta.pos})`;
    }

    const query = db
      .update(words)
      .set(set)
      .where(
        and(
          sql`lower(${words.english}) = ${english}`,
          or(isNull(words.transcription), isNull(words.partOfSpeech)),
        ),
      )
      .returning({ id: words.id });

    const rows = apply
      ? await query
      : await db
          .select({ id: words.id })
          .from(words)
          .where(
            and(
              sql`lower(${words.english}) = ${english}`,
              or(isNull(words.transcription), isNull(words.partOfSpeech)),
            ),
          );

    if (rows.length === 0) unused += 1;
    matched += rows.length;
  }

  console.log(`Yozuvlar: ${entries.length}, mos qatorlar: ${matched}`);
  if (unused > 0) console.log(`Hech qaysi bo'sh katakka tushmagan kalit: ${unused}`);
  console.log(apply ? "Applied." : "Dry run. Re-run with --apply to write.");

  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Word meta backfill failed:", err);
  process.exit(1);
});
