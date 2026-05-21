import type { Request, Response } from "express";
import { z } from "zod";
import { getLang, t } from "../i18n/index.ts";
import { isAuthConfigured, makeToken, verifyPassword } from "../middleware/auth.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

const loginSchema = z.object({ password: z.string().min(1) });

export const login = (req: Request, res: Response): void => {
  if (!isAuthConfigured()) {
    sendError(res, t(getLang(req), "errors.auth_not_configured"), 500);
    return;
  }
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success || !verifyPassword(parsed.data.password)) {
    sendError(res, t(getLang(req), "errors.invalid_password"), 401);
    return;
  }
  sendSuccess(res, { token: makeToken() });
};
