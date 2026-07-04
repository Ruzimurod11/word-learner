import type { Request, Response } from "express";
import * as transcriptionService from "../services/transcriptionService.ts";
import { getLang, t } from "../i18n/index.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

export const backfillTranscriptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await transcriptionService.backfillTranscriptions();
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.transcription_failed"));
  }
};
