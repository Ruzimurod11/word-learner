import type { Request, Response } from "express";
import * as partOfSpeechService from "../services/partOfSpeechService.ts";
import { getLang, t } from "../i18n/index.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

export const backfillPartsOfSpeech = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await partOfSpeechService.backfillPartsOfSpeech();
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.part_of_speech_failed"));
  }
};
