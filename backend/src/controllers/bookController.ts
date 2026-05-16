import type { Request, Response } from "express";
import * as bookService from "../services/bookService.ts";
import { bookIdSchema } from "../types/book.ts";
import { getLang, t } from "../i18n/index.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

export const listBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const books = await bookService.listBooks();
    sendSuccess(res, books);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.list_books_failed"));
  }
};

export const getBook = async (req: Request, res: Response): Promise<void> => {
  const idResult = bookIdSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_book_id"), 400);
    return;
  }
  try {
    const book = await bookService.getBookWithUnits(idResult.data);
    if (!book) {
      sendError(res, t(getLang(req), "errors.book_not_found"), 404);
      return;
    }
    sendSuccess(res, book);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.get_book_failed"));
  }
};
