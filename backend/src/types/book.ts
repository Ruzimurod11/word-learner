import { z } from "zod";

export const bookIdSchema = z.coerce.number().int().positive();

export type BookKind = "essential" | "vocabulary" | "passages" | "topic";

const emptyToNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

export const createTopicSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform(emptyToNull),
});

export type CreateTopicDto = z.infer<typeof createTopicSchema>;

export interface BookDto {
  id: number;
  order: number;
  title: string;
  description: string | null;
  kind: BookKind;
  unitCount: number;
  wordCount: number;
}

export interface UnitSummaryDto {
  id: number;
  order: number;
  title: string;
  wordCount: number;
  closed: boolean;
}

export interface BookWithUnitsDto extends BookDto {
  units: UnitSummaryDto[];
}
