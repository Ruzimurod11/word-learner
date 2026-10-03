import type { Request, Response } from "express";
import * as bookService from "../services/bookService.ts";
import type { TopicGuard } from "../services/bookService.ts";
import { bookIdSchema, createTopicSchema } from "../types/book.ts";
import { getLang, t } from "../i18n/index.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";
import { formatZodError } from "../utils/validation.ts";

const rejectTopicGuard = (
  res: Response,
  lang: ReturnType<typeof getLang>,
  guard: TopicGuard,
): void => {
  if (guard === "not_found") {
    sendError(res, t(lang, "errors.book_not_found"), 404);
    return;
  }
  sendError(res, t(lang, "errors.not_a_topic"), 400);
};

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

export const createTopic = async (req: Request, res: Response): Promise<void> => {
  const bodyResult = createTopicSchema.safeParse(req.body);
  if (!bodyResult.success) {
    sendError(res, formatZodError(bodyResult.error), 400);
    return;
  }
  try {
    const book = await bookService.createTopic(bodyResult.data);
    sendSuccess(res, book, 201);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.create_topic_failed"));
  }
};

export const updateTopic = async (req: Request, res: Response): Promise<void> => {
  const idResult = bookIdSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_book_id"), 400);
    return;
  }
  const bodyResult = createTopicSchema.safeParse(req.body);
  if (!bodyResult.success) {
    sendError(res, formatZodError(bodyResult.error), 400);
    return;
  }
  try {
    const result = await bookService.updateTopic(idResult.data, bodyResult.data);
    if (typeof result === "string") {
      rejectTopicGuard(res, getLang(req), result);
      return;
    }
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.update_topic_failed"));
  }
};

export const deleteTopic = async (req: Request, res: Response): Promise<void> => {
  const idResult = bookIdSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_book_id"), 400);
    return;
  }
  try {
    const result = await bookService.deleteTopic(idResult.data);
    if (result !== "deleted") {
      rejectTopicGuard(res, getLang(req), result);
      return;
    }
    sendSuccess(res, { id: idResult.data });
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.delete_topic_failed"));
  }
};

export const createTopicUnit = async (req: Request, res: Response): Promise<void> => {
  const idResult = bookIdSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_book_id"), 400);
    return;
  }
  try {
    const result = await bookService.createTopicUnit(idResult.data);
    if (typeof result === "string") {
      rejectTopicGuard(res, getLang(req), result);
      return;
    }
    sendSuccess(res, result, 201);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.create_unit_failed"));
  }
};
