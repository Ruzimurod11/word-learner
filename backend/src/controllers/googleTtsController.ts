import type { Request, Response } from "express";
import { backfillAudioWithGoogleTts } from "../services/googleTtsService.ts";
import { ttsBackfillSchema } from "../types/word.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";
import { formatZodError } from "../utils/validation.ts";

export const backfillWithGoogleTts = async (req: Request, res: Response): Promise<void> => {
  const bodyResult = ttsBackfillSchema.safeParse(req.body ?? {});
  if (!bodyResult.success) {
    sendError(res, formatZodError(bodyResult.error), 400);
    return;
  }
  try {
    const result = await backfillAudioWithGoogleTts(bodyResult.data.limit);
    sendSuccess(res, result);
  } catch (err) {
    console.error(err);
    sendError(res, "Google TTS backfill failed");
  }
};
