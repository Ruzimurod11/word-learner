import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  CreateWordDto,
  ListQuery,
  PaginatedWords,
  UpdateWordDto,
  Word,
} from "@/types/word";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const API = `${API_BASE.replace(/\/$/, "")}/words`;

const unwrap = <T,>(payload: ApiResponse<T>): T => {
  if (!payload.success) {
    throw new Error(payload.error);
  }
  return payload.data;
};

const handleError = (err: unknown): never => {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as Partial<ApiResponse<unknown>>;
    if (data && "error" in data && typeof data.error === "string") {
      throw new Error(data.error);
    }
  }
  if (err instanceof Error) throw err;
  throw new Error("Noma'lum xatolik");
};

export const getWords = async (query: ListQuery): Promise<PaginatedWords> => {
  try {
    const res = await axios.get<ApiResponse<PaginatedWords>>(API, { params: query });
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const createWord = async (data: CreateWordDto): Promise<Word> => {
  try {
    const res = await axios.post<ApiResponse<Word>>(API, data);
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const updateWord = async (
  id: number,
  data: UpdateWordDto,
): Promise<Word> => {
  try {
    const res = await axios.put<ApiResponse<Word>>(`${API}/${id}`, data);
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const deleteWord = async (id: number): Promise<void> => {
  try {
    const res = await axios.delete<ApiResponse<{ id: number }>>(`${API}/${id}`);
    unwrap(res.data);
  } catch (err) {
    handleError(err);
  }
};
