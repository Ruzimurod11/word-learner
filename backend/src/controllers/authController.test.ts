import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { makeToken } from "../middleware/auth.ts";
import { login } from "./authController.ts";

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return res as unknown as Response & typeof res;
};

const reqWithBody = (body: unknown): Request => ({ headers: {}, body }) as Request;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("login", () => {
  it("responds 500 when auth is not configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", undefined);
    const res = mockRes();
    login(reqWithBody({ password: "secret" }), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: expect.any(String) });
  });

  it("responds 401 for a missing or empty password", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    for (const body of [{}, { password: "" }, null]) {
      const res = mockRes();
      login(reqWithBody(body), res);
      expect(res.status).toHaveBeenCalledWith(401);
    }
  });

  it("responds 401 for a wrong password", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const res = mockRes();
    login(reqWithBody({ password: "wrong" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the derived token for the correct password", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const res = mockRes();
    login(reqWithBody({ password: "secret" }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: makeToken() },
    });
  });
});
