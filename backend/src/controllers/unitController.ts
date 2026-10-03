import type { Request, Response } from "express";
import { z } from "zod";
import * as bookService from "../services/bookService.ts";
import { getLang, t } from "../i18n/index.ts";
import { sendError, sendSuccess } from "../utils/responseHandler.ts";

const unitIdSchema = z.coerce.number().int().positive();

const setClosed = async (
  req: Request,
  res: Response,
  closed: boolean,
): Promise<void> => {
  const idResult = unitIdSchema.safeParse(req.params.unitId);
  if (!idResult.success) {
    sendError(res, t(getLang(req), "errors.invalid_unit_id"), 400);
    return;
  }
  try {
    const unit = await bookService.setUnitClosed(idResult.data, closed);
    if (!unit) {
      sendError(res, t(getLang(req), "errors.unit_not_found"), 404);
      return;
    }
    sendSuccess(res, unit);
  } catch (err) {
    console.error(err);
    sendError(
      res,
      t(getLang(req), closed ? "errors.close_unit_failed" : "errors.reopen_unit_failed"),
    );
  }
};

export const closeUnit = async (req: Request, res: Response): Promise<void> => {
  await setClosed(req, res, true);
};

export const reopenUnit = async (req: Request, res: Response): Promise<void> => {
  await setClosed(req, res, false);
};
