import { describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { getLang, languageMiddleware, parseAcceptLanguage, t } from "./index.ts";

describe("t", () => {
  it("returns the message for each supported language", () => {
    expect(t("uz", "errors.book_not_found")).toBe("Kitob topilmadi");
    expect(t("en", "errors.book_not_found")).toBe("Book not found");
    expect(t("ru", "errors.book_not_found")).toBe("Книга не найдена");
  });

  it("returns the key itself when it is unknown", () => {
    expect(t("en", "errors.no_such_key")).toBe("errors.no_such_key");
  });

  it("interpolates {{param}} placeholders", () => {
    expect(t("en", "errors.duplicate_word_at", { book: 2, unit: "5" })).toBe(
      "This word already exists in the dictionary (Book 2 / Unit 5)",
    );
  });
});

describe("parseAcceptLanguage", () => {
  it("picks the first supported base language", () => {
    expect(parseAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(parseAcceptLanguage("ru-RU")).toBe("ru");
    expect(parseAcceptLanguage("de,ru;q=0.8")).toBe("ru");
  });

  it("falls back to uz for unsupported or missing headers", () => {
    expect(parseAcceptLanguage("fr")).toBe("uz");
    expect(parseAcceptLanguage("")).toBe("uz");
    expect(parseAcceptLanguage(undefined)).toBe("uz");
  });
});

describe("getLang / languageMiddleware", () => {
  it("defaults to uz when the middleware has not run", () => {
    expect(getLang({} as Request)).toBe("uz");
  });

  it("stores the parsed language on the request and calls next", () => {
    const req = { headers: { "accept-language": "ru-RU,ru;q=0.9" } } as Request;
    const next = vi.fn();
    languageMiddleware(req, {} as never, next);
    expect(getLang(req)).toBe("ru");
    expect(next).toHaveBeenCalledOnce();
  });
});
