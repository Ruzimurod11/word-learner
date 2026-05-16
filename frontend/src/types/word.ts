export interface Word {
  id: number;
  english: string;
  translation: string;
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
}

export interface UpdateWordDto {
  english?: string;
  translation?: string;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
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
