import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { asc, eq, sql } from "drizzle-orm";
import { db, pool } from "./index.ts";
import { books, units, words } from "./schema.ts";

const BOOK_TITLE = "INTERMEDIATE PASSEGES";
const BOOK_KIND = "passages";

interface PassageJson {
  title: string;
  words: Array<{ english: string; translation: string }>;
}

// ELS VOCABULARY.pdf dagi "INTERMEDIATE PASSEGES" bo'limi: har bir matn — alohida
// bo'lim (unit), so'zlari PDF'dagi tartibda. Idempotent: bo'limda so'z bo'lsa tegilmaydi.
async function main(): Promise<void> {
  const jsonPath = fileURLToPath(
    new URL("./intermediatePassages.json", import.meta.url),
  );
  const passages: PassageJson[] = JSON.parse(readFileSync(jsonPath, "utf8"));
  console.log(`Seeding ${passages.length} passages...`);

  let [book] = await db.select().from(books).where(eq(books.kind, BOOK_KIND));
  if (!book) {
    const [maxRow] = await db
      .select({ max: sql<number | null>`max(${books.order})` })
      .from(books);
    [book] = await db
      .insert(books)
      .values({
        order: (maxRow?.max ?? 0) + 1,
        title: BOOK_TITLE,
        kind: BOOK_KIND,
      })
      .returning();
    console.log(`  + created "${BOOK_TITLE}"`);
  }
  if (!book) throw new Error(`Failed to create/find "${BOOK_TITLE}"`);

  const existingUnits = await db
    .select()
    .from(units)
    .where(eq(units.bookId, book.id))
    .orderBy(asc(units.order));
  const unitByOrder = new Map(existingUnits.map((u) => [u.order, u]));

  for (const [index, passage] of passages.entries()) {
    const order = index + 1;
    let unit = unitByOrder.get(order);
    if (!unit) {
      [unit] = await db
        .insert(units)
        .values({ bookId: book.id, order, title: passage.title })
        .returning();
    }
    if (!unit) throw new Error(`Failed to create unit ${order}`);
    const unitId = unit.id;

    const [countRow] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(words)
      .where(eq(words.unitId, unitId));
    if ((countRow?.count ?? 0) > 0) {
      console.log(`  = ${passage.title} — ${countRow?.count} so'z bor, o'tkazildi`);
      continue;
    }

    await db.insert(words).values(
      passage.words.map((w, i) => ({
        unitId,
        order: i + 1,
        english: w.english,
        translation: w.translation,
      })),
    );
    console.log(`  + ${passage.title} — ${passage.words.length} so'z`);
  }

  console.log("Passages seed done.");
  await pool.end();
}

main().catch((err: unknown) => {
  console.error("Passages seed failed:", err);
  process.exit(1);
});
