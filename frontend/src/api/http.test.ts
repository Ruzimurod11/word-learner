import { afterEach, describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { handleError, http, unwrap } from "@/api/http";
import i18n from "@/i18n";
import { getToken, setToken } from "@/lib/auth";

describe("unwrap", () => {
  it("returns data on success", () => {
    expect(unwrap({ success: true, data: [1, 2] })).toEqual([1, 2]);
  });

  it("throws the backend error message on failure", () => {
    expect(() => unwrap({ success: false, error: "boom" })).toThrow("boom");
  });
});

describe("handleError", () => {
  it("throws the backend error from an AxiosError response", () => {
    const err = new AxiosError("bad", "ERR_BAD_REQUEST", undefined, null, {
      data: { success: false, error: "srv xato" },
    } as never);
    expect(() => handleError(err)).toThrow("srv xato");
  });

  it("rethrows plain errors as-is", () => {
    const err = new Error("plain");
    expect(() => handleError(err)).toThrow(err);
  });

  it("wraps unknown values in a localized fallback error", () => {
    expect(() => handleError(42)).toThrow(i18n.t("common.error"));
  });
});

describe("interceptors", () => {
  const originalAdapter = http.defaults.adapter;

  afterEach(() => {
    http.defaults.adapter = originalAdapter;
    localStorage.clear();
  });

  const captureAdapter = (captured: { config?: InternalAxiosRequestConfig }) => {
    http.defaults.adapter = (config) => {
      captured.config = config;
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        data: { success: true, data: null },
      });
    };
  };

  const rejectAdapter = (status: number) => {
    http.defaults.adapter = (config) => {
      const response = { status, statusText: "", headers: {}, config, data: null };
      return Promise.reject(
        new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, response as never),
      );
    };
  };

  it("always sends Accept-Language; Authorization only with a token", async () => {
    const captured: { config?: InternalAxiosRequestConfig } = {};
    captureAdapter(captured);

    await http.get("/books");
    expect(captured.config?.headers["Accept-Language"]).toBe(i18n.language);
    expect(captured.config?.headers.Authorization).toBeUndefined();

    setToken("tok");
    await http.get("/books");
    expect(captured.config?.headers.Authorization).toBe("Bearer tok");
  });

  it("clears the stored token on a 401 response", async () => {
    setToken("tok");
    rejectAdapter(401);
    await expect(http.get("/books")).rejects.toThrow();
    expect(getToken()).toBeNull();
  });

  it("keeps the token on non-401 errors", async () => {
    setToken("tok");
    rejectAdapter(500);
    await expect(http.get("/books")).rejects.toThrow();
    expect(getToken()).toBe("tok");
  });
});
