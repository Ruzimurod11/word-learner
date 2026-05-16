import type { Request, Response } from "express";
import { z } from "zod";
import * as wordService from "../services/wordService.ts";
import {
  createWordSchema,
  listQuerySchema,
  updateWordSchema,
} from "../types/word.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

const idSchema = z.coerce.number().int().positive();

const formatZodError = (err: z.ZodError): string =>
  err.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");

export const listWords = async (req: Request, res: Response): Promise<void> => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }
  try {
    const result = await wordService.listWords(parsed.data);
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, "So'zlarni olishda xatolik");
  }
};

export const createWord = async (req: Request, res: Response): Promise<void> => {
  const parsed = createWordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, formatZodError(parsed.error), 400);
    return;
  }
  try {
    const word = await wordService.createWord(parsed.data);
    sendSuccess(res, word, 201);
  } catch (err: unknown) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      sendError(res, "Bu so'z allaqachon mavjud", 409);
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
      sendError(res, "Bu so'z allaqachon mavjud", 409);
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
