import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { isAuthConfigured, makeToken, requireAdmin, verifyPassword } from "./auth.ts";

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return res as unknown as Response & typeof res;
};

const reqWithAuth = (authorization?: string): Request =>
  ({ headers: authorization ? { authorization } : {} }) as Request;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAuthConfigured", () => {
  it("reflects whether ADMIN_PASSWORD is set", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    expect(isAuthConfigured()).toBe(true);
    vi.stubEnv("ADMIN_PASSWORD", undefined);
    expect(isAuthConfigured()).toBe(false);
  });
});

describe("makeToken", () => {
  it("is deterministic for the same password", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const first = makeToken();
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(makeToken()).toBe(first);
  });

  it("changes when the password changes", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const first = makeToken();
    vi.stubEnv("ADMIN_PASSWORD", "other");
    expect(makeToken()).not.toBe(first);
  });
});

describe("verifyPassword", () => {
  it("accepts the correct password", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    expect(verifyPassword("secret")).toBe(true);
  });

  it("rejects a wrong password (including different length)", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    expect(verifyPassword("secreT")).toBe(false);
    expect(verifyPassword("secret-longer")).toBe(false);
  });

  it("rejects everything when not configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", undefined);
    expect(verifyPassword("")).toBe(false);
    expect(verifyPassword("secret")).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("responds 500 when auth is not configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", undefined);
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(reqWithAuth(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 without an Authorization header", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(reqWithAuth(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 for a non-Bearer header", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(reqWithAuth(`Token ${makeToken()}`), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responds 401 for a wrong token", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(reqWithAuth("Bearer wrong-token"), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() for a valid token", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret");
    const res = mockRes();
    const next = vi.fn();
    requireAdmin(reqWithAuth(`Bearer ${makeToken()}`), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
