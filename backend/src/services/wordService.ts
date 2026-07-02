import { and, asc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.ts";
import { books, units, words, type Word } from "../db/schema.ts";

export interface WordLocation {
  bookOrder: number;
  unitOrder: number;
}

export async function findWordLocation(english: string): Promise<WordLocation | null> {
  const [row] = await db
    .select({ bookOrder: books.order, unitOrder: units.order })
    .from(words)
    .innerJoin(units, eq(units.id, words.unitId))
    .innerJoin(books, eq(books.id, units.bookId))
    .where(sql`lower(${words.english}) = lower(${english})`)
    .limit(1);
  return row ?? null;
}
import type {
  CreateWordDto,
  PaginatedSearchWords,
  PaginatedWords,
  QuizDto,
  QuizQuery,
  QuizQuestionDto,
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
  transcription: w.transcription,
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
        transcription: words.transcription,
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
    transcription: r.transcription,
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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface UnitPosition {
  bookOrder: number;
  unitOrder: number;
}

export async function getUnitPosition(unitId: number): Promise<UnitPosition | null> {
  const [row] = await db
    .select({ bookOrder: books.order, unitOrder: units.order })
    .from(units)
    .innerJoin(books, eq(books.id, units.bookId))
    .where(eq(units.id, unitId));
  return row ?? null;
}

export async function getQuiz(
  query: QuizQuery,
  range: { from?: UnitPosition; to?: UnitPosition } = {},
): Promise<QuizDto | null> {
  const { unitId, count, direction } = query;
  // uz-en: savol tarjimada, javob variantlari inglizchada; en-uz: aksincha
  const uzToEn = direction === "uz-en";

  const conditions: SQL[] = [];
  if (unitId !== undefined) conditions.push(eq(words.unitId, unitId));
  if (range.from) {
    conditions.push(
      sql`(${books.order}, ${units.order}) >= (${range.from.bookOrder}, ${range.from.unitOrder})`,
    );
  }
  if (range.to) {
    conditions.push(
      sql`(${books.order}, ${units.order}) <= (${range.to.bookOrder}, ${range.to.unitOrder})`,
    );
  }

  const questionRows = await db
    .select({ id: words.id, english: words.english, translation: words.translation })
    .from(words)
    .innerJoin(units, eq(units.id, words.unitId))
    .innerJoin(books, eq(books.id, units.bookId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`random()`)
    .limit(count);
  if (questionRows.length === 0) return null;

  const distinctAnswers = db
    .selectDistinct({ answer: uzToEn ? words.english : words.translation })
    .from(words)
    .as("dt");
  const poolRows = await db
    .select({ answer: distinctAnswers.answer })
    .from(distinctAnswers)
    .orderBy(sql`random()`)
    .limit(60);

  // translation ustuni unique emas — variantlar takrorlanmasligi uchun dedupe
  const seen = new Set<string>();
  const pool = poolRows
    .map((r) => r.answer)
    .filter((a) => {
      const key = a.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (pool.length < 4) return null;

  const questions: QuizQuestionDto[] = [];
  for (const row of questionRows) {
    const answer = uzToEn ? row.english : row.translation;
    const distractors = shuffle(
      pool.filter((a) => a.toLowerCase() !== answer.toLowerCase()),
    ).slice(0, 3);
    if (distractors.length < 3) return null;
    questions.push({
      id: row.id,
      question: uzToEn ? row.translation : row.english,
      options: shuffle([answer, ...distractors]),
      correct: answer,
    });
  }
  return { questions };
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
