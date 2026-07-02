import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import { sendError, sendSuccess } from "./responseHandler.ts";

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return res as unknown as Response & typeof res;
};

describe("sendSuccess", () => {
  it("sends { success: true, data } with status 200 by default", () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it("accepts a custom status code", () => {
    const res = mockRes();
    sendSuccess(res, null, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null });
  });
});

describe("sendError", () => {
  it("sends { success: false, error } with status 500 by default", () => {
    const res = mockRes();
    sendError(res, "boom");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "boom" });
  });

  it("accepts a custom status code", () => {
    const res = mockRes();
    sendError(res, "not found", 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: "not found" });
  });
});
