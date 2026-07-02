import type { Request, Response } from "express";
import { z } from "zod";
import * as wordService from "../services/wordService.ts";
import { getLang, t } from "../i18n/index.ts";
import {
  createWordSchema,
  quizQuerySchema,
  searchQuerySchema,
  unitWordsQuerySchema,
  updateWordSchema,
} from "../types/word.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

const idSchema = z.coerce.number().int().positive();

const formatZodError = (err: z.ZodError): string =>
  err.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");

const isUniqueViolation = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  if (/unique/i.test(err.message)) return true;
  const cause = (err as Error & { cause?: { code?: string } }).cause;
  return cause?.code === "23505";
};

export const listUnitWords = async (req: Request, res: Response): Promise<void> => {
  const unitIdResult = idSchema.safeParse(req.params.unitId);
  if (!unitIdResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_unit_id"), 400);
    return;
  }
  const queryResult = unitWordsQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    sendError(res, formatZodError(queryResult.error), 400);
    return;
  }
  try {
    const result = await wordService.listWordsByUnit(unitIdResult.data, queryResult.data);
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.list_words_failed"));
  }
};

export const createUnitWord = async (req: Request, res: Response): Promise<void> => {
  const unitIdResult = idSchema.safeParse(req.params.unitId);
  if (!unitIdResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_unit_id"), 400);
    return;
  }
  const bodyResult = createWordSchema.safeParse(req.body);
  if (!bodyResult.success) {
    sendError(res, formatZodError(bodyResult.error), 400);
    return;
  }
  try {
    const exists = await wordService.unitExists(unitIdResult.data);
    if (!exists) {
      sendError(res, t(getLang(req), "errors.unit_not_found"), 404);
      return;
    }
    const word = await wordService.createWord(unitIdResult.data, bodyResult.data);
    sendSuccess(res, word, 201);
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      const loc = await wordService.findWordLocation(bodyResult.data.english);
      const msg = loc
        ? t(getLang(req), "errors.duplicate_word_at", {
            book: loc.bookOrder,
            unit: loc.unitOrder,
          })
        : t(getLang(req), "errors.duplicate_word");
      sendError(res, msg, 409);
      return;
    }
    console.error(err);
    sendError(res, t(getLang(req), "errors.create_word_failed"));
  }
};

export const updateWord = async (req: Request, res: Response): Promise<void> => {
  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_id"), 400);
    return;
  }
  const bodyResult = updateWordSchema.safeParse(req.body);
  if (!bodyResult.success) {
    sendError(res, formatZodError(bodyResult.error), 400);
    return;
  }
  try {
    const word = await wordService.updateWord(idResult.data, bodyResult.data);
    if (!word) {
      sendError(res, t(getLang(req), "errors.word_not_found"), 404);
      return;
    }
    sendSuccess(res, word);
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      const newEnglish = bodyResult.data.english;
      const loc = newEnglish
        ? await wordService.findWordLocation(newEnglish)
        : null;
      const msg = loc
        ? t(getLang(req), "errors.duplicate_word_at", {
            book: loc.bookOrder,
            unit: loc.unitOrder,
          })
        : t(getLang(req), "errors.duplicate_word");
      sendError(res, msg, 409);
      return;
    }
    console.error(err);
    sendError(res, t(getLang(req), "errors.update_word_failed"));
  }
};

export const deleteWord = async (req: Request, res: Response): Promise<void> => {
  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_id"), 400);
    return;
  }
  try {
    const ok = await wordService.deleteWord(idResult.data);
    if (!ok) {
      sendError(res, t(getLang(req), "errors.word_not_found"), 404);
      return;
    }
    sendSuccess(res, { id: idResult.data });
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.delete_word_failed"));
  }
};

export const getQuiz = async (req: Request, res: Response): Promise<void> => {
  const parsed = quizQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }
  try {
    const { unitId, fromUnitId, toUnitId } = parsed.data;
    if (unitId !== undefined) {
      const exists = await wordService.unitExists(unitId);
      if (!exists) {
        sendError(res, t(getLang(req), "errors.unit_not_found"), 404);
        return;
      }
    }
    let from: wordService.UnitPosition | undefined;
    let to: wordService.UnitPosition | undefined;
    if (fromUnitId !== undefined) {
      from = (await wordService.getUnitPosition(fromUnitId)) ?? undefined;
      if (!from) {
        sendError(res, t(getLang(req), "errors.unit_not_found"), 404);
        return;
      }
    }
    if (toUnitId !== undefined) {
      to = (await wordService.getUnitPosition(toUnitId)) ?? undefined;
      if (!to) {
        sendError(res, t(getLang(req), "errors.unit_not_found"), 404);
        return;
      }
    }
    if (
      from &&
      to &&
      (from.bookOrder > to.bookOrder ||
        (from.bookOrder === to.bookOrder && from.unitOrder > to.unitOrder))
    ) {
      sendError(res, t(getLang(req), "errors.invalid_range"), 400);
      return;
    }
    const quiz = await wordService.getQuiz(parsed.data, { from, to });
    if (!quiz) {
      sendError(res, t(getLang(req), "errors.quiz_not_enough_words"), 400);
      return;
    }
    sendSuccess(res, quiz);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.quiz_failed"));
  }
};

export const searchWords = async (req: Request, res: Response): Promise<void> => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }
  try {
    const result = await wordService.searchWords(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.search_failed"));
  }
};
