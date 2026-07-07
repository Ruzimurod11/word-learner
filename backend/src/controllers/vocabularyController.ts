import type { Request, Response } from "express";
import * as vocabularyService from "../services/vocabularyService.ts";
import * as wordService from "../services/wordService.ts";
import { getLang, t } from "../i18n/index.ts";
import { createWordSchema } from "../types/word.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";
import { formatZodError, isUniqueViolation } from "../utils/validation.ts";

export const getVocabulary = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await vocabularyService.getVocabularyWithUnits();
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.list_words_failed"));
  }
};

export const addVocabularyWord = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bodyResult = createWordSchema.safeParse(req.body);
  if (!bodyResult.success) {
    sendError(res, formatZodError(bodyResult.error), 400);
    return;
  }
  try {
    const result = await vocabularyService.addVocabularyWord(bodyResult.data);
    sendSuccess(res, result, 201);
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
