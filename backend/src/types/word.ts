import { z } from "zod";

export const createWordSchema = z.object({
  english: z.string().trim().min(1, "English so'z bo'sh bo'lmasligi kerak").max(100),
  translation: z.string().trim().min(1, "Tarjima bo'sh bo'lmasligi kerak").max(200),
});

export const updateWordSchema = createWordSchema.partial().refine(
  (data) => data.english !== undefined || data.translation !== undefined,
  { message: "Kamida bitta maydon yuborilishi kerak" },
);

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type CreateWordDto = z.infer<typeof createWordSchema>;
export type UpdateWordDto = z.infer<typeof updateWordSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;

export interface PaginatedWords {
  items: Array<{
    id: number;
    english: string;
    translation: string;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
