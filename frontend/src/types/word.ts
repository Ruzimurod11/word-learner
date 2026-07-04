export interface Word {
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
  items: Word[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateWordDto {
  english: string;
  translation: string;
  transcription?: string | null;
}

export interface UpdateWordDto {
  english?: string;
  translation?: string;
  transcription?: string | null;
}

export interface UnitWordsQuery {
  page?: number;
  pageSize?: number;
}

export interface SearchQuery {
  q: string;
  page?: number;
  pageSize?: number;
}

export interface SearchWord extends Word {
  bookId: number;
  bookOrder: number;
  bookTitle: string;
  unitOrder: number;
  unitTitle: string;
}

export interface PaginatedSearchWords {
  items: SearchWord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type QuizDirection = "uz-en" | "en-uz";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  // kichik harfli inglizcha so'z -> IPA transkripsiya
  transcriptions: Record<string, string>;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
