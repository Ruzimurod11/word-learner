import { handleError, http, unwrap } from "@/api/http";
import type {
  ApiResponse,
  CreateWordDto,
  PaginatedSearchWords,
  PaginatedWords,
  QuizDirection,
  QuizLevel,
  QuizResponse,
  SearchQuery,
  UnitWordsQuery,
  UpdateWordDto,
  Word,
} from "@/types/word";

export const getUnitWords = async (
  unitId: number,
  query: UnitWordsQuery = {},
): Promise<PaginatedWords> => {
  try {
    const res = await http.get<ApiResponse<PaginatedWords>>(
      `/units/${unitId}/words`,
      { params: query },
    );
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const createUnitWord = async (
  unitId: number,
  data: CreateWordDto,
): Promise<Word> => {
  try {
    const res = await http.post<ApiResponse<Word>>(
      `/units/${unitId}/words`,
      data,
    );
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
    const res = await http.put<ApiResponse<Word>>(`/words/${id}`, data);
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const reorderUnitWords = async (
  unitId: number,
  orderedIds: number[],
): Promise<Word[]> => {
  try {
    const res = await http.put<ApiResponse<Word[]>>(
      `/units/${unitId}/words/order`,
      { orderedIds },
    );
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const deleteWord = async (id: number): Promise<void> => {
  try {
    const res = await http.delete<ApiResponse<{ id: number }>>(`/words/${id}`);
    unwrap(res.data);
  } catch (err) {
    handleError(err);
  }
};

export const getQuiz = async (
  params: {
    unitId?: number;
    fromUnitId?: number;
    toUnitId?: number;
    count?: number;
    direction?: QuizDirection;
    level?: QuizLevel;
  } = {},
): Promise<QuizResponse> => {
  try {
    const res = await http.get<ApiResponse<QuizResponse>>("/words/quiz", {
      params,
    });
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export interface BackfillTranscriptionsResult {
  updated: number;
  remaining: number;
}

export const backfillTranscriptions =
  async (): Promise<BackfillTranscriptionsResult> => {
    try {
      const res = await http.post<ApiResponse<BackfillTranscriptionsResult>>(
        "/words/backfill-transcriptions",
      );
      return unwrap(res.data);
    } catch (err) {
      return handleError(err);
    }
  };

export const searchWords = async (
  query: SearchQuery,
): Promise<PaginatedSearchWords> => {
  try {
    const res = await http.get<ApiResponse<PaginatedSearchWords>>(
      "/words/search",
      { params: query },
    );
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};
