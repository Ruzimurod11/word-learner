import type { Request, Response } from "express";
import { z } from "zod";
import * as wordService from "../services/wordService.ts";
import {
  createWordSchema,
  searchQuerySchema,
  unitWordsQuerySchema,
  updateWordSchema,
} from "../types/word.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

const idSchema = z.coerce.number().int().positive();

const formatZodError = (err: z.ZodError): string =>
  err.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");

export const listUnitWords = async (req: Request, res: Response): Promise<void> => {
  const unitIdResult = idSchema.safeParse(req.params.unitId);
  if (!unitIdResult.success) {
    sendError(res, "Noto'g'ri unit ID", 400);
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
    sendError(res, "So'zlarni olishda xatolik");
  }
};

export const createUnitWord = async (req: Request, res: Response): Promise<void> => {
  const unitIdResult = idSchema.safeParse(req.params.unitId);
  if (!unitIdResult.success) {
    sendError(res, "Noto'g'ri unit ID", 400);
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
      sendError(res, "Unit topilmadi", 404);
      return;
    }
    const word = await wordService.createWord(unitIdResult.data, bodyResult.data);
    sendSuccess(res, word, 201);
  } catch (err: unknown) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      sendError(res, "Bu so'z bu unitda allaqachon mavjud", 409);
      return;
    }
    console.error(err);
    sendError(res, "So'z qo'shishda xatolik");
  }
};

export const updateWord = async (req: Request, res: Response): Promise<void> => {
  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, "Noto'g'ri ID", 400);
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
      sendError(res, "So'z topilmadi", 404);
      return;
    }
    sendSuccess(res, word);
  } catch (err: unknown) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      sendError(res, "Bu so'z bu unitda allaqachon mavjud", 409);
      return;
    }
    console.error(err);
    sendError(res, "So'zni yangilashda xatolik");
  }
};

export const deleteWord = async (req: Request, res: Response): Promise<void> => {
  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    sendError(res, "Noto'g'ri ID", 400);
    return;
  }
  try {
    const ok = await wordService.deleteWord(idResult.data);
    if (!ok) {
      sendError(res, "So'z topilmadi", 404);
      return;
    }
    sendSuccess(res, { id: idResult.data });
  } catch (err) {
    console.error(err);
    sendError(res, "O'chirishda xatolik");
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
    sendError(res, "Qidiruvda xatolik");
  }
};
