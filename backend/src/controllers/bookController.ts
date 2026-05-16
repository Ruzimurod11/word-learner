import type { Request, Response } from "express";
import * as bookService from "../services/bookService.ts";
import { bookIdSchema } from "../types/book.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

export const listBooks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const books = await bookService.listBooks();
    sendSuccess(res, books);
  } catch (err) {
    console.error(err);
    sendError(res, "Kitoblarni olishda xatolik");
  }
};

export const getBook = async (req: Request, res: Response): Promise<void> => {
  const idResult = bookIdSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, "Noto'g'ri kitob ID", 400);
    return;
  }
  try {
    const book = await bookService.getBookWithUnits(idResult.data);
    if (!book) {
      sendError(res, "Kitob topilmadi", 404);
      return;
    }
    sendSuccess(res, book);
  } catch (err) {
    console.error(err);
    sendError(res, "Kitobni olishda xatolik");
  }
};
