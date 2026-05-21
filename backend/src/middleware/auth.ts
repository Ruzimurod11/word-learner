import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getLang, t } from "../i18n/index.ts";
import { sendError } from "../utils/responseHandler.ts";

const SESSION_PAYLOAD = "admin-session";

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

// Opaque session token derived from the admin password. Changing the password
// invalidates previously issued tokens. The password itself is never exposed.
export function makeToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", secret).update(SESSION_PAYLOAD).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyPassword(password: string): boolean {
  if (!isAuthConfigured()) return false;
  return safeEqual(password, process.env.ADMIN_PASSWORD ?? "");
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthConfigured()) {
    sendError(res, t(getLang(req), "errors.auth_not_configured"), 500);
    return;
  }
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, makeToken())) {
    sendError(res, t(getLang(req), "errors.unauthorized"), 401);
    return;
  }
  next();
}
