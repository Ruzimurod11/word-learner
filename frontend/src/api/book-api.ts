import { handleError, http, unwrap } from "@/api/http";
import type { Book, BookWithUnits } from "@/types/book";
import type { ApiResponse } from "@/types/word";

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
