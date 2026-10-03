import { asc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { books, units, words } from "../db/schema.ts";
import type {
  BookDto,
  BookKind,
  BookWithUnitsDto,
  CreateTopicDto,
  UnitSummaryDto,
} from "../types/book.ts";

export type TopicGuard = "not_found" | "not_topic";

export async function listBooks(): Promise<BookDto[]> {
  const rows = await db
    .select({
      id: books.id,
      order: books.order,
      title: books.title,
      description: books.description,
      kind: books.kind,
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
    kind: r.kind as BookKind,
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
      closed: units.closed,
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
    closed: u.closed,
  }));

  const totalWords = unitDtos.reduce((acc, u) => acc + u.wordCount, 0);

  return {
    id: book.id,
    order: book.order,
    title: book.title,
    description: book.description,
    kind: book.kind as BookKind,
    unitCount: unitDtos.length,
    wordCount: totalWords,
    units: unitDtos,
  };
}

export async function getUnit(
  unitId: number,
): Promise<{ id: number; bookId: number; closed: boolean } | null> {
  const [row] = await db
    .select({ id: units.id, bookId: units.bookId, closed: units.closed })
    .from(units)
    .where(eq(units.id, unitId));
  return row ?? null;
}

async function nextBookOrder(): Promise<number> {
  const [maxRow] = await db
    .select({ max: sql<number | null>`max(${books.order})` })
    .from(books);
  return (maxRow?.max ?? 0) + 1;
}

export async function createTopic(input: CreateTopicDto): Promise<BookWithUnitsDto> {
  const [book] = await db
    .insert(books)
    .values({
      order: await nextBookOrder(),
      title: input.title,
      description: input.description,
      kind: "topic",
    })
    .returning();
  if (!book) throw new Error("Mavzuni yaratib bo'lmadi");

  await db.insert(units).values({
    bookId: book.id,
    order: 1,
    title: "Unit 1",
  });

  const created = await getBookWithUnits(book.id);
  if (!created) throw new Error("Mavzuni yaratib bo'lmadi");
  return created;
}

async function topicBook(bookId: number): Promise<TopicGuard | { id: number }> {
  const [book] = await db.select().from(books).where(eq(books.id, bookId));
  if (!book) return "not_found";
  if (book.kind !== "topic") return "not_topic";
  return { id: book.id };
}

export async function updateTopic(
  bookId: number,
  input: CreateTopicDto,
): Promise<BookWithUnitsDto | TopicGuard> {
  const guard = await topicBook(bookId);
  if (typeof guard === "string") return guard;

  await db
    .update(books)
    .set({
      title: input.title,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(eq(books.id, bookId));

  const updated = await getBookWithUnits(bookId);
  if (!updated) return "not_found";
  return updated;
}

export async function deleteTopic(bookId: number): Promise<TopicGuard | "deleted"> {
  const guard = await topicBook(bookId);
  if (typeof guard === "string") return guard;
  await db.delete(books).where(eq(books.id, bookId));
  return "deleted";
}

export async function createTopicUnit(
  bookId: number,
): Promise<UnitSummaryDto | TopicGuard> {
  const guard = await topicBook(bookId);
  if (typeof guard === "string") return guard;

  const [maxRow] = await db
    .select({ max: sql<number | null>`max(${units.order})` })
    .from(units)
    .where(eq(units.bookId, bookId));
  const nextOrder = (maxRow?.max ?? 0) + 1;

  const [unit] = await db
    .insert(units)
    .values({
      bookId,
      order: nextOrder,
      title: `Unit ${nextOrder}`,
    })
    .returning();
  if (!unit) throw new Error("Unit yaratib bo'lmadi");

  return {
    id: unit.id,
    order: unit.order,
    title: unit.title,
    wordCount: 0,
    closed: unit.closed,
  };
}

export async function setUnitClosed(
  unitId: number,
  closed: boolean,
): Promise<UnitSummaryDto | null> {
  const [unit] = await db
    .update(units)
    .set({ closed, updatedAt: new Date() })
    .where(eq(units.id, unitId))
    .returning();
  if (!unit) return null;

  const [countRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(words)
    .where(eq(words.unitId, unitId));

  return {
    id: unit.id,
    order: unit.order,
    title: unit.title,
    wordCount: countRow?.count ?? 0,
    closed: unit.closed,
  };
}
