import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, getToken, setToken } from "@/lib/auth";

beforeEach(() => {
  localStorage.clear();
});

describe("token store", () => {
  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("setToken persists the token to localStorage", () => {
    setToken("t123");
    expect(getToken()).toBe("t123");
    expect(localStorage.getItem("admin_token")).toBe("t123");
  });

  it("clearToken removes the token", () => {
    setToken("t123");
    clearToken();
    expect(getToken()).toBeNull();
    expect(localStorage.getItem("admin_token")).toBeNull();
  });
});
