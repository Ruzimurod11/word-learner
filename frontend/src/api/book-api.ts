import { handleError, http, unwrap } from "@/api/http";
import type { Book, BookWithUnits, UnitSummary } from "@/types/book";
import type { ApiResponse } from "@/types/word";

export interface TopicInput {
    title: string;
    description?: string | null;
}

export const getBooks = async (): Promise<Book[]> => {
    try {
        const res = await http.get<ApiResponse<Book[]>>("/books");
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const getBook = async (id: number): Promise<BookWithUnits> => {
    try {
        const res = await http.get<ApiResponse<BookWithUnits>>(`/books/${id}`);
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const createTopic = async (
    input: TopicInput,
): Promise<BookWithUnits> => {
    try {
        const res = await http.post<ApiResponse<BookWithUnits>>(
            "/books",
            input,
        );
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const updateTopic = async (
    id: number,
    input: TopicInput,
): Promise<BookWithUnits> => {
    try {
        const res = await http.patch<ApiResponse<BookWithUnits>>(
            `/books/${id}`,
            input,
        );
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const deleteTopic = async (id: number): Promise<{ id: number }> => {
    try {
        const res = await http.delete<ApiResponse<{ id: number }>>(
            `/books/${id}`,
        );
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const createTopicUnit = async (bookId: number): Promise<UnitSummary> => {
    try {
        const res = await http.post<ApiResponse<UnitSummary>>(
            `/books/${bookId}/units`,
        );
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const closeUnit = async (unitId: number): Promise<UnitSummary> => {
    try {
        const res = await http.post<ApiResponse<UnitSummary>>(
            `/units/${unitId}/close`,
        );
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};

export const reopenUnit = async (unitId: number): Promise<UnitSummary> => {
    try {
        const res = await http.post<ApiResponse<UnitSummary>>(
            `/units/${unitId}/reopen`,
        );
        return unwrap(res.data);
    } catch (err) {
        return handleError(err);
    }
};
