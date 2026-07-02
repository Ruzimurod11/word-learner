import { beforeEach, describe, expect, it, vi } from "vitest";

// Modul import paytida o'zini init qiladi, shuning uchun har testda
// registry tozalanib, dinamik import qilinadi.
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("initial language", () => {
  it("defaults to uz when nothing is stored", async () => {
    const mod = await import("@/i18n");
    expect(mod.initialLang).toBe("uz");
    expect(mod.getLang()).toBe("uz");
  });

  it("uses the stored language when it is supported", async () => {
    localStorage.setItem("lang", "ru");
    const mod = await import("@/i18n");
    expect(mod.initialLang).toBe("ru");
  });

  it("falls back to uz for an unsupported stored value", async () => {
    localStorage.setItem("lang", "xx");
    const mod = await import("@/i18n");
    expect(mod.initialLang).toBe("uz");
  });
});

describe("setLang", () => {
  it("switches the language and persists it", async () => {
    const mod = await import("@/i18n");
    mod.setLang("en");
    await vi.waitFor(() => {
      expect(mod.getLang()).toBe("en");
    });
    expect(localStorage.getItem("lang")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});
