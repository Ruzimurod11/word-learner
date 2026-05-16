import { asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { books, units, words, type Word } from "../db/schema.ts";
import type {
  CreateWordDto,
  PaginatedSearchWords,
  PaginatedWords,
  SearchQuery,
  SearchWordDto,
  UnitWordsQuery,
  UpdateWordDto,
  WordDto,
} from "../types/word.ts";

const toDto = (w: Word): WordDto => ({
  id: w.id,
  unitId: w.unitId,
  order: w.order,
  english: w.english,
  translation: w.translation,
  createdAt: w.createdAt.toISOString(),
  updatedAt: w.updatedAt.toISOString(),
});

export async function listWordsByUnit(
  unitId: number,
  query: UnitWordsQuery,
): Promise<PaginatedWords> {
  const { page, pageSize } = query;
  const offset = (page - 1) * pageSize;
  const whereExpr = eq(words.unitId, unitId);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(words)
      .where(whereExpr)
      .orderBy(asc(words.order), asc(words.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(words)
      .where(whereExpr),
  ]);

  const total = countRows[0]?.count ?? 0;

  return {
    items: rows.map(toDto),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function searchWords(
  query: SearchQuery,
): Promise<PaginatedSearchWords> {
  const { q, page, pageSize } = query;
  const offset = (page - 1) * pageSize;
  const searchExpr = or(
    ilike(words.english, `%${q}%`),
    ilike(words.translation, `%${q}%`),
  );

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: words.id,
        unitId: words.unitId,
        order: words.order,
        english: words.english,
        translation: words.translation,
        createdAt: words.createdAt,
        updatedAt: words.updatedAt,
        bookId: books.id,
        bookOrder: books.order,
        bookTitle: books.title,
        unitOrder: units.order,
        unitTitle: units.title,
      })
      .from(words)
      .innerJoin(units, eq(units.id, words.unitId))
      .innerJoin(books, eq(books.id, units.bookId))
      .where(searchExpr)
      .orderBy(asc(books.order), asc(units.order), asc(words.order))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(words)
      .where(searchExpr),
  ]);

  const total = countRows[0]?.count ?? 0;

  const items: SearchWordDto[] = rows.map((r) => ({
    id: r.id,
    unitId: r.unitId,
    order: r.order,
    english: r.english,
    translation: r.translation,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    bookId: r.bookId,
    bookOrder: r.bookOrder,
    bookTitle: r.bookTitle,
    unitOrder: r.unitOrder,
    unitTitle: r.unitTitle,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function unitExists(unitId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: units.id })
    .from(units)
    .where(eq(units.id, unitId));
  return !!row;
}

export async function createWord(
  unitId: number,
  data: CreateWordDto,
): Promise<WordDto> {
  const [maxRow] = await db
    .select({ max: sql<number | null>`max(${words.order})` })
    .from(words)
    .where(eq(words.unitId, unitId));
  const nextOrder = (maxRow?.max ?? 0) + 1;

  const [row] = await db
    .insert(words)
    .values({ ...data, unitId, order: nextOrder })
    .returning();
  if (!row) throw new Error("So'zni yaratib bo'lmadi");
  return toDto(row);
}

export async function updateWord(
  id: number,
  data: UpdateWordDto,
): Promise<WordDto | null> {
  const [row] = await db
    .update(words)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(words.id, id))
    .returning();
  return row ? toDto(row) : null;
}

export async function deleteWord(id: number): Promise<boolean> {
  const result = await db
    .delete(words)
    .where(eq(words.id, id))
    .returning({ id: words.id });
  return result.length > 0;
}
