import { and, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.ts";
import { books, units, words, type Word } from "../db/schema.ts";

export interface WordLocation {
  bookOrder: number;
  unitOrder: number;
}

// Dublikat (english, translation) juftligi qaysi kitob/unitda ekanini topadi.
export async function findWordLocation(
  english: string,
  translation: string,
): Promise<WordLocation | null> {
  const [row] = await db
    .select({ bookOrder: books.order, unitOrder: units.order })
    .from(words)
    .innerJoin(units, eq(units.id, words.unitId))
    .innerJoin(books, eq(books.id, units.bookId))
    .where(
      sql`lower(${words.english}) = lower(${english}) and lower(${words.translation}) = lower(${translation})`,
    )
    .limit(1);
  return row ?? null;
}

export async function getWordById(id: number): Promise<Word | null> {
  const [row] = await db.select().from(words).where(eq(words.id, id)).limit(1);
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
  const { unitId, count, direction, level } = query;
  // uz-en: savol tarjimada, javob variantlari inglizchada; en-uz: aksincha.
  // hard darajada savol doim o'zbekcha, javob inglizcha yoziladi
  const uzToEn = level === "hard" || direction === "uz-en";

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
    .select({
      id: words.id,
      english: words.english,
      translation: words.translation,
      transcription: words.transcription,
    })
    .from(words)
    .innerJoin(units, eq(units.id, words.unitId))
    .innerJoin(books, eq(books.id, units.bookId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`random()`)
    .limit(count);
  if (questionRows.length === 0) return null;

  // inglizcha so'z -> IPA; savoldagi (en-uz) va variantlardagi (uz-en) inglizcha
  // matnlar uchun. Uzbek matn map'ga tushmaydi, shuning uchun frontend
  // yo'nalishdan qat'i nazar mos kalitni topib ko'rsatadi.
  const transcriptions: Record<string, string> = {};
  for (const row of questionRows) {
    if (row.transcription) {
      transcriptions[row.english.toLowerCase()] = row.transcription;
    }
  }

  // hard darajada variant yo'q, shuning uchun distraktorlar pooli ham kerak emas
  if (level === "hard") {
    return {
      questions: questionRows.map((row) => ({
        id: row.id,
        question: row.translation,
        options: [],
        correct: row.english,
      })),
      transcriptions,
    };
  }

  // distraktorlar faqat test qamrovidagi (unit yoki oraliq) so'zlardan olinadi
  const distinctAnswers = db
    .selectDistinct({
      answer: uzToEn ? words.english : words.translation,
      transcription: words.transcription,
    })
    .from(words)
    .innerJoin(units, eq(units.id, words.unitId))
    .innerJoin(books, eq(books.id, units.bookId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .as("dt");
  const poolRows = await db
    .select({
      answer: distinctAnswers.answer,
      transcription: distinctAnswers.transcription,
    })
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

  if (uzToEn) {
    for (const r of poolRows) {
      if (r.transcription) {
        transcriptions[r.answer.toLowerCase()] = r.transcription;
      }
    }
  }

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
  return { questions, transcriptions };
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

// Joriy sahifadagi so'zlarni yangi tartibda qayta joylashtiradi.
// orderedIds — sahifadagi so'z id'lari yangi ko'rinish tartibida.
// Shu so'zlarning mavjud `order` qiymatlarini "slot" sifatida qayta biriktiramiz,
// shunda boshqa sahifalardagi so'zlar tegilmaydi. To'plam mos kelmasa null qaytadi.
export async function reorderWords(
  unitId: number,
  orderedIds: number[],
): Promise<WordDto[] | null> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(words)
      .where(and(eq(words.unitId, unitId), inArray(words.id, orderedIds)));

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length || rows.length !== orderedIds.length) {
      return null;
    }

    const slots = rows.map((r) => r.order).sort((a, b) => a - b);
    const now = new Date();
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(words)
        .set({ order: slots[i], updatedAt: now })
        .where(eq(words.id, orderedIds[i]));
    }

    const updated = await tx
      .select()
      .from(words)
      .where(eq(words.unitId, unitId))
      .orderBy(asc(words.order), asc(words.id));
    return updated.map(toDto);
  });
}

export async function deleteWord(id: number): Promise<boolean> {
  const result = await db
    .delete(words)
    .where(eq(words.id, id))
    .returning({ id: words.id });
  return result.length > 0;
}
