import { asc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { books, units, words } from "../db/schema.ts";
import type {
  BookDto,
  BookWithUnitsDto,
  UnitSummaryDto,
} from "../types/book.ts";

export async function listBooks(): Promise<BookDto[]> {
  const rows = await db
    .select({
      id: books.id,
      order: books.order,
      title: books.title,
      description: books.description,
      unitCount: sql<number>`cast(count(distinct ${units.id}) as int)`,
      wordCount: sql<number>`cast(count(${words.id}) as int)`,
    })
    .from(books)
    .leftJoin(units, eq(units.bookId, books.id))
    .leftJoin(words, eq(words.unitId, units.id))
    .groupBy(books.id)
    .orderBy(asc(books.order));

  return rows.map((r) => ({
    id: r.id,
    order: r.order,
    title: r.title,
    description: r.description,
    unitCount: r.unitCount ?? 0,
    wordCount: r.wordCount ?? 0,
  }));
}

export async function getBookWithUnits(
  bookId: number,
): Promise<BookWithUnitsDto | null> {
  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) return null;

  const unitRows = await db
    .select({
      id: units.id,
      order: units.order,
      title: units.title,
      wordCount: sql<number>`cast(count(${words.id}) as int)`,
    })
    .from(units)
    .leftJoin(words, eq(words.unitId, units.id))
    .where(eq(units.bookId, bookId))
    .groupBy(units.id)
    .orderBy(asc(units.order));

  const unitDtos: UnitSummaryDto[] = unitRows.map((u) => ({
    id: u.id,
    order: u.order,
    title: u.title,
    wordCount: u.wordCount ?? 0,
  }));

  const totalWords = unitDtos.reduce((acc, u) => acc + u.wordCount, 0);

  return {
    id: book.id,
    order: book.order,
    title: book.title,
    description: book.description,
    unitCount: unitDtos.length,
    wordCount: totalWords,
    units: unitDtos,
  };
}
