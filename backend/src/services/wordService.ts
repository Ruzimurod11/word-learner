import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { words, type Word } from "../db/schema.ts";
import type {
  CreateWordDto,
  ListQuery,
  PaginatedWords,
  UpdateWordDto,
} from "../types/word.ts";

const toDto = (w: Word): PaginatedWords["items"][number] => ({
  id: w.id,
  english: w.english,
  translation: w.translation,
  createdAt: w.createdAt.toISOString(),
  updatedAt: w.updatedAt.toISOString(),
});

export async function listWords(query: ListQuery): Promise<PaginatedWords> {
  const { page, pageSize, search } = query;
  const offset = (page - 1) * pageSize;

  const searchCondition =
    search && search.length > 0
      ? or(
          ilike(words.english, `%${search}%`),
          ilike(words.translation, `%${search}%`),
        )
      : undefined;

  const whereExpr = searchCondition ? and(searchCondition) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(words)
      .where(whereExpr)
      .orderBy(desc(words.createdAt), asc(words.id))
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

export async function createWord(
  data: CreateWordDto,
): Promise<PaginatedWords["items"][number]> {
  const [row] = await db.insert(words).values(data).returning();
  if (!row) throw new Error("So'zni yaratib bo'lmadi");
  return toDto(row);
}

export async function updateWord(
  id: number,
  data: UpdateWordDto,
): Promise<PaginatedWords["items"][number] | null> {
  const [row] = await db
    .update(words)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(words.id, id))
    .returning();
  return row ? toDto(row) : null;
}

export async function deleteWord(id: number): Promise<boolean> {
  const result = await db.delete(words).where(eq(words.id, id)).returning({ id: words.id });
  return result.length > 0;
}
