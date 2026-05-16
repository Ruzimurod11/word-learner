import { z } from "zod";

export const bookIdSchema = z.coerce.number().int().positive();

export interface BookDto {
  id: number;
  order: number;
  title: string;
  description: string | null;
  unitCount: number;
  wordCount: number;
}

export interface UnitSummaryDto {
  id: number;
  order: number;
  title: string;
  wordCount: number;
}

export interface BookWithUnitsDto extends BookDto {
  units: UnitSummaryDto[];
}
