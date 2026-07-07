import type { Request, Response } from "express";
import { z } from "zod";
import * as wordService from "../services/wordService.ts";
import { getLang, t } from "../i18n/index.ts";
import {
  createWordSchema,
  quizQuerySchema,
  reorderWordsSchema,
  searchQuerySchema,
  unitWordsQuerySchema,
  updateWordSchema,
} from "../types/word.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";
import { formatZodError, isUniqueViolation } from "../utils/validation.ts";

const idSchema = z.coerce.number().int().positive();

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
      const loc = await wordService.findWordLocation(
        bodyResult.data.english,
        bodyResult.data.translation,
      );
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
      // Update qisman bo'lishi mumkin: yuborilmagan tomonni mavjud yozuvdan olamiz,
      // shunda dublikat juftlik (english, translation) to'g'ri aniqlanadi.
      const existing = await wordService.getWordById(idResult.data);
      const english = bodyResult.data.english ?? existing?.english;
      const translation = bodyResult.data.translation ?? existing?.translation;
      const loc =
        english && translation
          ? await wordService.findWordLocation(english, translation)
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

export const reorderUnitWords = async (req: Request, res: Response): Promise<void> => {
  const unitIdResult = idSchema.safeParse(req.params.unitId);
  if (!unitIdResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_unit_id"), 400);
    return;
  }
  const bodyResult = reorderWordsSchema.safeParse(req.body);
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
    const words = await wordService.reorderWords(
      unitIdResult.data,
      bodyResult.data.orderedIds,
    );
    if (!words) {
      sendError(res, t(getLang(req), "errors.reorder_mismatch"), 400);
      return;
    }
    sendSuccess(res, words);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.reorder_words_failed"));
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
