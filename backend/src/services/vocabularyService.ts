import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { books, units, words, type Book, type Unit } from "../db/schema.ts";
import { getBookWithUnits } from "./bookService.ts";
import { createWord } from "./wordService.ts";
import type { BookWithUnitsDto } from "../types/book.ts";
import type { CreateWordDto, WordDto } from "../types/word.ts";

// Har bir "tag" (Bo'lim) sig'imi — to'lgach keyingi tag avtomatik ochiladi
export const VOCAB_TAG_SIZE = 100;

// Yagona Vocabularies kitobini topadi; yo'q bo'lsa lazy yaratadi.
export async function getOrCreateVocabBook(): Promise<Book> {
  const [existing] = await db
    .select()
    .from(books)
    .where(eq(books.kind, "vocabulary"))
    .limit(1);
  if (existing) return existing;

  const [maxRow] = await db
    .select({ max: sql<number | null>`max(${books.order})` })
    .from(books);
  const nextOrder = (maxRow?.max ?? 0) + 1;

  const [created] = await db
    .insert(books)
    .values({ order: nextOrder, title: "Vocabularies", kind: "vocabulary" })
    .returning();
  if (!created) throw new Error("Vocabularies kitobini yaratib bo'lmadi");
  return created;
}

export async function getVocabularyWithUnits(): Promise<BookWithUnitsDto> {
  const book = await getOrCreateVocabBook();
  const withUnits = await getBookWithUnits(book.id);
  if (!withUnits) throw new Error("Vocabularies kitobi topilmadi");
  return withUnits;
}

async function countWordsInUnit(unitId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(words)
    .where(eq(words.unitId, unitId));
  return row?.count ?? 0;
}

// So'zni joriy (oxirgi) tag'ga qo'yadi; tag to'lgan (yoki yo'q) bo'lsa yangi tag ochadi.
export async function addVocabularyWord(
  data: CreateWordDto,
): Promise<{ word: WordDto; unit: { id: number; order: number } }> {
  const book = await getOrCreateVocabBook();

  const [lastUnit] = await db
    .select()
    .from(units)
    .where(eq(units.bookId, book.id))
    .orderBy(desc(units.order))
    .limit(1);

  let target: Unit | undefined = lastUnit;
  if (target && (await countWordsInUnit(target.id)) >= VOCAB_TAG_SIZE) {
    target = undefined;
  }

  if (!target) {
    const nextOrder = (lastUnit?.order ?? 0) + 1;
    [target] = await db
      .insert(units)
      .values({ bookId: book.id, order: nextOrder, title: `Part ${nextOrder}` })
      .returning();
    if (!target) throw new Error("Yangi bo'lim yaratib bo'lmadi");
  }

  const word = await createWord(target.id, data);
  return { word, unit: { id: target.id, order: target.order } };
}
