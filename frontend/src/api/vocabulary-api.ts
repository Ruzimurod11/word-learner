import { handleError, http, unwrap } from "@/api/http";
import type { BookWithUnits } from "@/types/book";
import type { ApiResponse, CreateWordDto, Word } from "@/types/word";

export interface AddVocabularyWordResult {
  word: Word;
  unit: { id: number; order: number };
}

export const getVocabulary = async (): Promise<BookWithUnits> => {
  try {
    const res = await http.get<ApiResponse<BookWithUnits>>("/vocabulary");
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const addVocabularyWord = async (
  data: CreateWordDto,
): Promise<AddVocabularyWordResult> => {
  try {
    const res = await http.post<ApiResponse<AddVocabularyWordResult>>(
      "/vocabulary/words",
      data,
    );
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};
