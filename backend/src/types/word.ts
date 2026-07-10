import { z } from "zod";

export const createWordSchema = z.object({
  english: z.string().trim().min(1, "English so'z bo'sh bo'lmasligi kerak").max(100),
  translation: z.string().trim().min(1, "Tarjima bo'sh bo'lmasligi kerak").max(200),
  transcription: z.string().trim().max(200).nullable().optional(),
});

export const updateWordSchema = createWordSchema.partial().refine(
  (data) =>
    data.english !== undefined ||
    data.translation !== undefined ||
    data.transcription !== undefined,
  { message: "Kamida bitta maydon yuborilishi kerak" },
);

export const reorderWordsSchema = z.object({
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

export const unitWordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Qidiruv so'rovi bo'sh bo'lmasligi kerak"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const quizQuerySchema = z.object({
  unitId: z.coerce.number().int().positive().optional(),
  fromUnitId: z.coerce.number().int().positive().optional(),
  toUnitId: z.coerce.number().int().positive().optional(),
  // yuqori chegara yo'q: LIMIT bazadagi mavjud so'zlar sonidan oshirmaydi
  count: z.coerce.number().int().min(1).default(20),
  direction: z.enum(["uz-en", "en-uz"]).default("uz-en"),
  // easy: 4 ta variantdan tanlanadi; hard: javob qo'lda yoziladi
  level: z.enum(["easy", "hard"]).default("easy"),
});

export type CreateWordDto = z.infer<typeof createWordSchema>;
export type UpdateWordDto = z.infer<typeof updateWordSchema>;
export type ReorderWordsDto = z.infer<typeof reorderWordsSchema>;
export type UnitWordsQuery = z.infer<typeof unitWordsQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type QuizQuery = z.infer<typeof quizQuerySchema>;

export interface WordDto {
  id: number;
  unitId: number;
  order: number;
  english: string;
  translation: string;
  transcription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedWords {
  items: WordDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchWordDto extends WordDto {
  bookId: number;
  bookOrder: number;
  bookTitle: string;
  unitOrder: number;
  unitTitle: string;
}

export interface PaginatedSearchWords {
  items: SearchWordDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QuizQuestionDto {
  id: number;
  question: string;
  // hard darajada bo'sh: javob variantlardan tanlanmaydi, yoziladi
  options: string[];
  correct: string;
}

export interface QuizDto {
  questions: QuizQuestionDto[];
  // kichik harfli inglizcha so'z -> IPA transkripsiya; faqat inglizcha matn
  // (uz-en'da variantlar, en-uz'da savol) uchun to'ldiriladi
  transcriptions: Record<string, string>;
}
