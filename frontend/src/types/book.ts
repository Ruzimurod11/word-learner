export type BookKind = "essential" | "vocabulary" | "passages" | "topic";

export interface Book {
  id: number;
  order: number;
  title: string;
  description: string | null;
  kind: BookKind;
  unitCount: number;
  wordCount: number;
}

export interface UnitSummary {
  id: number;
  order: number;
  title: string;
  wordCount: number;
  closed: boolean;
}

export interface BookWithUnits extends Book {
  units: UnitSummary[];
}
