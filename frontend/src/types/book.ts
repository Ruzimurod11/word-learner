export interface Book {
  id: number;
  order: number;
  title: string;
  description: string | null;
  unitCount: number;
  wordCount: number;
}

export interface UnitSummary {
  id: number;
  order: number;
  title: string;
  wordCount: number;
}

export interface BookWithUnits extends Book {
  units: UnitSummary[];
}
