import type { Request, Response } from "express";
import * as profileService from "../services/profileService.ts";
import { updateProfileSchema } from "../types/profile.ts";
import { getLang, t } from "../i18n/index.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";
import { formatZodError } from "../utils/validation.ts";

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const profile = await profileService.getProfile();
    sendSuccess(res, profile);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.get_profile_failed"));
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = updateProfileSchema.safeParse(req.body);
  if (!result.success) {
    sendError(res, formatZodError(result.error), 400);
    return;
  }
  try {
    const profile = await profileService.updateProfile(result.data);
    sendSuccess(res, profile);
  } catch (err) {
    console.error(err);
    sendError(res, t(getLang(req), "errors.update_profile_failed"));
  }
};
